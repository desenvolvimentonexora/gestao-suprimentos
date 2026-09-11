export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          tenant_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          tenant_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_lines: {
        Row: {
          ai_confidence: number | null
          comparison_id: string
          created_at: string
          extracted_by_ai: boolean
          id: string
          quotation_item_id: string
          request_item_id: string
          tenant_id: string
        }
        Insert: {
          ai_confidence?: number | null
          comparison_id: string
          created_at?: string
          extracted_by_ai?: boolean
          id?: string
          quotation_item_id: string
          request_item_id: string
          tenant_id: string
        }
        Update: {
          ai_confidence?: number | null
          comparison_id?: string
          created_at?: string
          extracted_by_ai?: boolean
          id?: string
          quotation_item_id?: string
          request_item_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_lines_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_lines_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_lines_request_item_id_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_winners: {
        Row: {
          comparison_id: string
          created_at: string
          id: string
          quotation_item_id: string
          request_item_id: string
          tenant_id: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          id?: string
          quotation_item_id: string
          request_item_id: string
          tenant_id: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          id?: string
          quotation_item_id?: string
          request_item_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_winners_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_winners_quotation_item_id_fkey"
            columns: ["quotation_item_id"]
            isOneToOne: false
            referencedRelation: "quotation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_winners_request_item_id_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_winners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          financial_charge_requested: boolean
          id: string
          payment_condition_note: string | null
          rejection_reason: string | null
          released_at: string | null
          released_by: string | null
          request_id: string
          status: Database["public"]["Enums"]["comparison_status"]
          tenant_id: string
          updated_at: string
          winning_quotation_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          financial_charge_requested?: boolean
          id?: string
          payment_condition_note?: string | null
          rejection_reason?: string | null
          released_at?: string | null
          released_by?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["comparison_status"]
          tenant_id: string
          updated_at?: string
          winning_quotation_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          financial_charge_requested?: boolean
          id?: string
          payment_condition_note?: string | null
          rejection_reason?: string | null
          released_at?: string | null
          released_by?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["comparison_status"]
          tenant_id?: string
          updated_at?: string
          winning_quotation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_winning_quotation_id_fkey"
            columns: ["winning_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_mappings: {
        Row: {
          column_mapping: Json
          created_at: string
          id: string
          import_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          column_mapping: Json
          created_at?: string
          id?: string
          import_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          column_mapping?: Json
          created_at?: string
          id?: string
          import_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          icon: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          icon?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          icon?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          material_id: string
          order_id: string
          quantity: number
          request_item_id: string
          supplier_id: string
          tenant_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          order_id: string
          quantity: number
          request_item_id: string
          supplier_id: string
          tenant_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          order_id?: string
          quantity?: number
          request_item_id?: string
          supplier_id?: string
          tenant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_request_item_id_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          comparison_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expected_delivery_date: string | null
          id: string
          order_number: string
          payment_condition_note: string | null
          request_id: string
          status: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          order_number: string
          payment_condition_note?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_delivery_date?: string | null
          id?: string
          order_number?: string
          payment_condition_note?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_attachments: {
        Row: {
          file_name: string
          id: string
          quotation_id: string
          storage_path: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          id?: string
          quotation_id: string
          storage_path: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          id?: string
          quotation_id?: string
          storage_path?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_attachments_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          lead_time_days: number | null
          quotation_id: string
          request_item_id: string
          tenant_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_time_days?: number | null
          quotation_id: string
          request_item_id: string
          tenant_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          lead_time_days?: number | null
          quotation_id?: string
          request_item_id?: string
          tenant_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_request_item_id_fkey"
            columns: ["request_item_id"]
            isOneToOne: false
            referencedRelation: "request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          request_id: string
          status: Database["public"]["Enums"]["quotation_status"]
          submitted_at: string | null
          supplier_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          request_id: string
          status?: Database["public"]["Enums"]["quotation_status"]
          submitted_at?: string | null
          supplier_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["quotation_status"]
          submitted_at?: string | null
          supplier_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      request_items: {
        Row: {
          authorized_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          material_id: string
          quantity: number
          request_id: string
          status_code: string | null
          tenant_id: string
          unit_of_measure: string | null
        }
        Insert: {
          authorized_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id: string
          quantity: number
          request_id: string
          status_code?: string | null
          tenant_id: string
          unit_of_measure?: string | null
        }
        Update: {
          authorized_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          material_id?: string
          quantity?: number
          request_id?: string
          status_code?: string | null
          tenant_id?: string
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          external_ref: string | null
          id: string
          needed_by: string | null
          negotiating_started_at: string | null
          negotiator_id: string | null
          notes: string | null
          requester_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          subject_category: string | null
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          external_ref?: string | null
          id?: string
          needed_by?: string | null
          negotiating_started_at?: string | null
          negotiator_id?: string | null
          notes?: string | null
          requester_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject_category?: string | null
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          external_ref?: string | null
          id?: string
          needed_by?: string | null
          negotiating_started_at?: string | null
          negotiator_id?: string | null
          notes?: string | null
          requester_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          subject_category?: string | null
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_negotiator_id_fkey"
            columns: ["negotiator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          brand: Json
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          id: string
          tenant_id: string
          theme: Json
          updated_at: string
          vocabulary: Json
        }
        Insert: {
          brand?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          tenant_id: string
          theme?: Json
          updated_at?: string
          vocabulary?: Json
        }
        Update: {
          brand?: Json
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          id?: string
          tenant_id?: string
          theme?: Json
          updated_at?: string
          vocabulary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_certificates: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          file_name: string
          file_path: string
          id: string
          supplier_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          file_name: string
          file_path: string
          id?: string
          supplier_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          supplier_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          supplier_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          supplier_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          supplier_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_documents: {
        Row: {
          cnpj: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          supplier_id: string
          tenant_id: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          supplier_id: string
          tenant_id: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          supplier_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_favorites: {
        Row: {
          created_at: string
          supplier_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          supplier_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          supplier_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_favorites_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_favorites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_materials: {
        Row: {
          created_at: string
          lead_time_days: number | null
          material_id: string
          supplier_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          lead_time_days?: number | null
          material_id: string
          supplier_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          lead_time_days?: number | null
          material_id?: string
          supplier_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_materials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_reviews: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          rating: number
          supplier_id: string
          tenant_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          rating: number
          supplier_id: string
          tenant_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          rating?: number
          supplier_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          status: string
          tenant_id: string
          type: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          tenant_id: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_categories: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          icon: string
          id: string
          name: string
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          licensed_modules: string[]
          name: string
          subdomain: string
          supabase_anon_key: string
          supabase_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          licensed_modules?: string[]
          name: string
          subdomain: string
          supabase_anon_key: string
          supabase_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          licensed_modules?: string[]
          name?: string
          subdomain?: string
          supabase_anon_key?: string
          supabase_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          admin_email: string | null
          admin_name: string | null
          admin_phone: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          end_date: string | null
          engineer_email: string | null
          engineer_name: string | null
          engineer_phone: string | null
          id: string
          name: string
          neighborhood: string | null
          number: string | null
          start_date: string | null
          state: string | null
          status: string
          street: string | null
          tenant_id: string
          type: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          admin_email?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          engineer_email?: string | null
          engineer_name?: string | null
          engineer_phone?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          number?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          street?: string | null
          tenant_id: string
          type?: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          admin_email?: string | null
          admin_name?: string | null
          admin_phone?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          end_date?: string | null
          engineer_email?: string | null
          engineer_name?: string | null
          engineer_phone?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          start_date?: string | null
          state?: string | null
          status?: string
          street?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email: string
          full_name: string
          id: string
          organization_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      fn_decide_comparison: {
        Args: {
          p_comparison_id: string
          p_decided_by: string
          p_decision: Database["public"]["Enums"]["comparison_status"]
          p_rejection_reason?: string
        }
        Returns: undefined
      }
      fn_release_comparison: {
        Args: {
          p_comparison_id: string
          p_decided_by: string
          p_decision: Database["public"]["Enums"]["comparison_status"]
          p_payment_condition_note?: string
          p_rejection_reason?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      comparison_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "pending_release"
        | "released"
      order_status: "issued" | "cancelled"
      quotation_status: "pending" | "received" | "discarded"
      request_status: "draft" | "open" | "negotiating" | "quoted" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      comparison_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "pending_release",
        "released",
      ],
      order_status: ["issued", "cancelled"],
      quotation_status: ["pending", "received", "discarded"],
      request_status: ["draft", "open", "negotiating", "quoted", "cancelled"],
    },
  },
} as const
