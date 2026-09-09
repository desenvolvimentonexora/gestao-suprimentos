/**
 * scripts/import-fornecedores.mjs
 *
 * Importa uma planilha de fornecedores (.xlsx) no formato usado pela Ampla
 * para as tabelas suppliers / supplier_contacts / supplier_documents /
 * materials / supplier_materials / supply_categories do tenant informado.
 *
 * Formato esperado da planilha (primeira aba), colunas:
 *   Fornecedor | CNPJ | Setor | Telefone | E-mail | Contato | Cidade |
 *   Status | Qtd Insumos | Insumos que fornece | Observações
 *
 * - CNPJ pode conter múltiplos valores separados por " / ".
 * - "Setor" e "Insumos que fornece" podem conter múltiplos valores separados por vírgula.
 * - A coluna "Setor" da planilha vira supply_categories (categoria do insumo,
 *   ex.: elétrica, hidráulica) — não tem relação com os setores de negócio da
 *   Home (Suprimentos, Engenharia...), que são conteúdo estático no código.
 * - Categoria de um material é decidida na primeira vez que ele aparece, pela
 *   primeira categoria listada no fornecedor que o mencionou. É uma
 *   aproximação: ao final, o script lista os fornecedores com mais de uma
 *   categoria na planilha para revisão manual.
 *
 * PRÉ-REQUISITOS DE SCHEMA: supabase/migrations/0003_suppliers.sql
 *   (supply_categories, materials, suppliers, supplier_contacts,
 *   supplier_documents, supplier_materials).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TENANT_ID=... \
 *     node scripts/import-fornecedores.mjs ./Fornecedores_Ampla_2026-08-21.xlsx
 *
 * A SUPABASE_SERVICE_ROLE_KEY é necessária porque o script grava direto,
 * ignorando RLS. Rode isso apenas localmente, nunca em CI nem com a chave
 * commitada. Depois de rodar, revogue/rotacione se desconfiar de exposição.
 */

import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const [, , filePath] = process.argv;
if (!filePath) {
  console.error("Uso: node scripts/import-fornecedores.mjs <arquivo.xlsx>");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TENANT_ID = process.env.TENANT_ID;

if (!SUPABASE_URL || !SERVICE_KEY || !TENANT_ID) {
  console.error("Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e TENANT_ID no ambiente.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const DEFAULT_CATEGORY = "Geral";

function splitList(value, sep = ",") {
  if (!value) return [];
  return String(value)
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitCnpjs(value) {
  if (!value) return [];
  return String(value)
    .split("/")
    .map((s) => s.trim())
    // CNPJ tem barra dentro dele mesmo (00.000.000/0001-00);
    // reagrupamos pelo padrão XX.XXX.XXX antes de cada pedaço.
    .reduce((acc, part) => {
      if (/^\d{2}\.\d{3}\.\d{3}$/.test(part) || acc.length === 0) {
        acc.push(part);
      } else {
        acc[acc.length - 1] += "/" + part;
      }
      return acc;
    }, []);
}

async function main() {
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  console.log(`Lidas ${rows.length} linhas de ${filePath}`);

  // 1. Categorias de insumo: garante que existem.
  const { data: existingCategories, error: categoryErr } = await supabase
    .from("supply_categories")
    .select("id, name")
    .eq("tenant_id", TENANT_ID);
  if (categoryErr) throw categoryErr;
  const categoryByName = new Map(existingCategories.map((c) => [c.name, c.id]));

  async function getOrCreateCategory(name) {
    if (categoryByName.has(name)) return categoryByName.get(name);
    const { data, error } = await supabase
      .from("supply_categories")
      .insert({ tenant_id: TENANT_ID, name, slug: name.toLowerCase() })
      .select("id")
      .single();
    if (error) throw error;
    categoryByName.set(name, data.id);
    console.warn(`Categoria de insumo "${name}" não existia e foi criada. Confirme se é esperado.`);
    return data.id;
  }

  // 2. Materiais (insumos): primeira ocorrência decide a categoria (heurística — revisar depois).
  const materialCategoryGuess = new Map(); // nome material -> nome categoria
  for (const r of rows) {
    const materials = splitList(r["Insumos que fornece"]);
    if (!materials.length) continue;
    const categorias = splitList(r["Setor"]);
    const primaryCategory = categorias[0] || DEFAULT_CATEGORY;
    for (const m of materials) {
      if (!materialCategoryGuess.has(m)) materialCategoryGuess.set(m, primaryCategory);
    }
  }

  const materialIdByName = new Map();
  for (const [materialName, categoryName] of materialCategoryGuess) {
    const categoryId = await getOrCreateCategory(categoryName);
    const { data: found } = await supabase
      .from("materials")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("name", materialName)
      .maybeSingle();
    if (found) {
      materialIdByName.set(materialName, found.id);
      continue;
    }
    const { data: created, error } = await supabase
      .from("materials")
      .insert({ tenant_id: TENANT_ID, name: materialName, category_id: categoryId })
      .select("id")
      .single();
    if (error) throw error;
    materialIdByName.set(materialName, created.id);
  }
  console.log(`Materiais prontos: ${materialIdByName.size}`);

  // 3. Fornecedores + contatos + CNPJs + vínculos.
  let created = 0;
  let skipped = 0;
  const multiCategoryWarnings = [];

  for (const r of rows) {
    const name = r["Fornecedor"];
    if (!name) continue;

    const categoriesRow = splitList(r["Setor"]);
    if (categoriesRow.length > 1) {
      multiCategoryWarnings.push(
        `${name}: categorias ${categoriesRow.join(", ")} — confira a categoria atribuída a cada material dele.`,
      );
    }

    const status = (r["Status"] || "Ativo").toLowerCase() === "ativo";

    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("tenant_id", TENANT_ID)
      .eq("name", name)
      .maybeSingle();

    let supplierId = existingSupplier?.id;

    if (!supplierId) {
      const { data: sup, error } = await supabase
        .from("suppliers")
        .insert({
          tenant_id: TENANT_ID,
          name,
          city: r["Cidade"] || null,
          status: status ? "active" : "inactive",
          notes: r["Observações"] || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      supplierId = sup.id;
      created++;
    } else {
      skipped++;
    }

    // Contato principal
    if (r["Contato"] || r["Telefone"] || r["E-mail"]) {
      await supabase.from("supplier_contacts").upsert(
        {
          tenant_id: TENANT_ID,
          supplier_id: supplierId,
          name: r["Contato"] || "Contato principal",
          phone: r["Telefone"] || null,
          email: r["E-mail"] || null,
        },
        { onConflict: "supplier_id,email" },
      );
    }

    // CNPJs (um ou mais)
    for (const cnpj of splitCnpjs(r["CNPJ"])) {
      await supabase.from("supplier_documents").upsert(
        { tenant_id: TENANT_ID, supplier_id: supplierId, cnpj },
        { onConflict: "supplier_id,cnpj" },
      );
    }

    // Vínculo com materiais
    for (const materialName of splitList(r["Insumos que fornece"])) {
      const materialId = materialIdByName.get(materialName);
      if (!materialId) continue;
      await supabase.from("supplier_materials").upsert(
        { tenant_id: TENANT_ID, supplier_id: supplierId, material_id: materialId },
        { onConflict: "supplier_id,material_id" },
      );
    }
  }

  console.log(`Fornecedores novos: ${created}, já existentes (atualizados): ${skipped}`);
  if (multiCategoryWarnings.length) {
    console.log("\nRevisar manualmente (fornecedores com mais de uma categoria na planilha):");
    multiCategoryWarnings.forEach((w) => console.log(" - " + w));
  }
  console.log("\nImportação concluída.");
}

main().catch((err) => {
  console.error("Erro na importação:", err);
  process.exit(1);
});
