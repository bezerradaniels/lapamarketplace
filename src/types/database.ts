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
  public: {
    Tables: {
      billing_events: {
        Row: {
          payload: Json
          received_at: string
          store_id: string | null
          stripe_event_id: string
          type: string
        }
        Insert: {
          payload: Json
          received_at?: string
          store_id?: string | null
          stripe_event_id: string
          type: string
        }
        Update: {
          payload?: Json
          received_at?: string
          store_id?: string | null
          stripe_event_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          parent_id: string | null
          position: number
          slug: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          id: number
          name: string
          state_id: number
        }
        Insert: {
          id: number
          name: string
          state_id: number
        }
        Update: {
          id?: number
          name?: string
          state_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      complimentary_subscriptions: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          plan_id: Database["public"]["Enums"]["plan_id"]
          reason: string | null
          store_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          plan_id?: Database["public"]["Enums"]["plan_id"]
          reason?: string | null
          store_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          plan_id?: Database["public"]["Enums"]["plan_id"]
          reason?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complimentary_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          category_interests: string[]
          cpf_cnpj: string | null
          cpf_cnpj_type: string
          created_at: string
          email: string | null
          id: string
          name: string
          product_interests: string[]
          profile_notes: string | null
          secondary_phone: string | null
          seller_id: string | null
          social_links: Json
          store_id: string
          tags: string[]
          updated_at: string
          website: string | null
          whatsapp_phone: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          category_interests?: string[]
          cpf_cnpj?: string | null
          cpf_cnpj_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          product_interests?: string[]
          profile_notes?: string | null
          secondary_phone?: string | null
          seller_id?: string | null
          social_links?: Json
          store_id: string
          tags?: string[]
          updated_at?: string
          website?: string | null
          whatsapp_phone: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          category_interests?: string[]
          cpf_cnpj?: string | null
          cpf_cnpj_type?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          product_interests?: string[]
          profile_notes?: string | null
          secondary_phone?: string | null
          seller_id?: string | null
          social_links?: Json
          store_id?: string
          tags?: string[]
          updated_at?: string
          website?: string | null
          whatsapp_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_in_cents: number
          created_at: string
          hosted_invoice_url: string | null
          id: string
          nfse_url: string | null
          paid_at: string | null
          pdf_url: string | null
          status: string
          store_id: string
          stripe_invoice_id: string
        }
        Insert: {
          amount_in_cents: number
          created_at?: string
          hosted_invoice_url?: string | null
          id?: string
          nfse_url?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status: string
          store_id: string
          stripe_invoice_id: string
        }
        Update: {
          amount_in_cents?: number
          created_at?: string
          hosted_invoice_url?: string | null
          id?: string
          nfse_url?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          store_id?: string
          stripe_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          link: string | null
          read_at: string | null
          store_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          store_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          link?: string | null
          read_at?: string | null
          store_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_in_cents: number
          product_id: string | null
          product_name: string
          quantity: number
          selected_variation: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_in_cents: number
          product_id?: string | null
          product_name: string
          quantity: number
          selected_variation?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_in_cents?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          selected_variation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          customer_name: string
          customer_notes: string | null
          customer_phone: string
          discount_in_cents: number
          id: string
          seller_id: string | null
          source: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_in_cents: number
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_name: string
          customer_notes?: string | null
          customer_phone: string
          discount_in_cents?: number
          id?: string
          seller_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_in_cents: number
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string
          discount_in_cents?: number
          id?: string
          seller_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          total_in_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "store_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          has_ai_helpers: boolean
          has_custom_theme: boolean
          has_featured_products: boolean
          has_gallery: boolean
          has_pdf_export: boolean
          max_coupons: number | null
          max_products: number | null
          max_sellers: number | null
          name: string
          plan_id: Database["public"]["Enums"]["plan_id"]
          price_in_cents: number
          stripe_price_annual: string | null
          stripe_price_id: string | null
          stripe_price_monthly: string | null
          trial_period_days: number
        }
        Insert: {
          has_ai_helpers?: boolean
          has_custom_theme?: boolean
          has_featured_products?: boolean
          has_gallery?: boolean
          has_pdf_export?: boolean
          max_coupons?: number | null
          max_products?: number | null
          max_sellers?: number | null
          name: string
          plan_id: Database["public"]["Enums"]["plan_id"]
          price_in_cents: number
          stripe_price_annual?: string | null
          stripe_price_id?: string | null
          stripe_price_monthly?: string | null
          trial_period_days?: number
        }
        Update: {
          has_ai_helpers?: boolean
          has_custom_theme?: boolean
          has_featured_products?: boolean
          has_gallery?: boolean
          has_pdf_export?: boolean
          max_coupons?: number | null
          max_products?: number | null
          max_sellers?: number | null
          name?: string
          plan_id?: Database["public"]["Enums"]["plan_id"]
          price_in_cents?: number
          stripe_price_annual?: string | null
          stripe_price_id?: string | null
          stripe_price_monthly?: string | null
          trial_period_days?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          auto_sku: boolean
          barcode: string | null
          barcode_type: string | null
          brand: string | null
          category: string | null
          condition: string
          cost_in_cents: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          has_no_brand: boolean
          has_variations: boolean
          id: string
          images: string[]
          installment_count: number | null
          installment_total_in_cents: number | null
          is_active: boolean
          is_featured: boolean
          name: string
          price_in_cents: number
          promo_price_in_cents: number | null
          purchase_recurrence: string | null
          sku: string | null
          stock: number | null
          store_id: string
          subcategory: string | null
          unit: string | null
          updated_at: string
          variation_label: string | null
          variation_options: Json | null
          variation_type: string | null
        }
        Insert: {
          auto_sku?: boolean
          barcode?: string | null
          barcode_type?: string | null
          brand?: string | null
          category?: string | null
          condition?: string
          cost_in_cents?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          has_no_brand?: boolean
          has_variations?: boolean
          id?: string
          images?: string[]
          installment_count?: number | null
          installment_total_in_cents?: number | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_in_cents: number
          promo_price_in_cents?: number | null
          purchase_recurrence?: string | null
          sku?: string | null
          stock?: number | null
          store_id: string
          subcategory?: string | null
          unit?: string | null
          updated_at?: string
          variation_label?: string | null
          variation_options?: Json | null
          variation_type?: string | null
        }
        Update: {
          auto_sku?: boolean
          barcode?: string | null
          barcode_type?: string | null
          brand?: string | null
          category?: string | null
          condition?: string
          cost_in_cents?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          has_no_brand?: boolean
          has_variations?: boolean
          id?: string
          images?: string[]
          installment_count?: number | null
          installment_total_in_cents?: number | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_in_cents?: number
          promo_price_in_cents?: number | null
          purchase_recurrence?: string | null
          sku?: string | null
          stock?: number | null
          store_id?: string
          subcategory?: string | null
          unit?: string | null
          updated_at?: string
          variation_label?: string | null
          variation_options?: Json | null
          variation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seller_catalogs: {
        Row: {
          avatar_url: string | null
          catalog_products: string
          catalog_slug: string
          contact_email: string | null
          created_at: string
          has_dashboard_access: boolean
          id: string
          linked_user_id: string | null
          name: string
          specific_product_ids: string[]
          store_id: string
          updated_at: string
          use_store_whatsapp: boolean
          whatsapp_phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          catalog_products?: string
          catalog_slug: string
          contact_email?: string | null
          created_at?: string
          has_dashboard_access?: boolean
          id?: string
          linked_user_id?: string | null
          name: string
          specific_product_ids?: string[]
          store_id: string
          updated_at?: string
          use_store_whatsapp?: boolean
          whatsapp_phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          catalog_products?: string
          catalog_slug?: string
          contact_email?: string | null
          created_at?: string
          has_dashboard_access?: boolean
          id?: string
          linked_user_id?: string | null
          name?: string
          specific_product_ids?: string[]
          store_id?: string
          updated_at?: string
          use_store_whatsapp?: boolean
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_catalogs_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_catalogs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          id: number
          name: string
          uf: string
        }
        Insert: {
          id: number
          name: string
          uf: string
        }
        Update: {
          id?: number
          name?: string
          uf?: string
        }
        Relationships: []
      }
      store_coupons: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          custom_url: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_subtotal_in_cents: number
          store_id: string
          updated_at: string
          used_count: number
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          custom_url?: string | null
          description?: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_subtotal_in_cents?: number
          store_id: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          custom_url?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_subtotal_in_cents?: number
          store_id?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_coupons_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_members_user_id_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          about_us: string | null
          accepted_payment_methods: string[]
          accepted_shipping_methods: string[]
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          age_restricted: boolean
          banner_url: string | null
          cart_enabled: boolean
          category: string | null
          cnpj: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          custom_links: Json
          deleted_at: string | null
          delivery_hours: Json
          gallery_images: Json
          gtm_id: string | null
          id: string
          instagram: string | null
          locale: string
          logo_url: string | null
          name: string
          owner_id: string
          payment_instructions_message: string | null
          payment_instructions_title: string | null
          primary_color: string
          product_sort: Database["public"]["Enums"]["product_sort_order"]
          require_cpf: boolean
          require_payment_choice: boolean
          require_shipping_choice: boolean
          show_out_of_stock: boolean
          slogan: string | null
          slug: string
          slug_last_updated_at: string | null
          social_links: Json
          updated_at: string
          whatsapp_button_enabled: boolean
          whatsapp_phone: string | null
        }
        Insert: {
          about_us?: string | null
          accepted_payment_methods?: string[]
          accepted_shipping_methods?: string[]
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          age_restricted?: boolean
          banner_url?: string | null
          cart_enabled?: boolean
          category?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          custom_links?: Json
          deleted_at?: string | null
          delivery_hours?: Json
          gallery_images?: Json
          gtm_id?: string | null
          id?: string
          instagram?: string | null
          locale?: string
          logo_url?: string | null
          name: string
          owner_id: string
          payment_instructions_message?: string | null
          payment_instructions_title?: string | null
          primary_color?: string
          product_sort?: Database["public"]["Enums"]["product_sort_order"]
          require_cpf?: boolean
          require_payment_choice?: boolean
          require_shipping_choice?: boolean
          show_out_of_stock?: boolean
          slogan?: string | null
          slug: string
          slug_last_updated_at?: string | null
          social_links?: Json
          updated_at?: string
          whatsapp_button_enabled?: boolean
          whatsapp_phone?: string | null
        }
        Update: {
          about_us?: string | null
          accepted_payment_methods?: string[]
          accepted_shipping_methods?: string[]
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          age_restricted?: boolean
          banner_url?: string | null
          cart_enabled?: boolean
          category?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          custom_links?: Json
          deleted_at?: string | null
          delivery_hours?: Json
          gallery_images?: Json
          gtm_id?: string | null
          id?: string
          instagram?: string | null
          locale?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          payment_instructions_message?: string | null
          payment_instructions_title?: string | null
          primary_color?: string
          product_sort?: Database["public"]["Enums"]["product_sort_order"]
          require_cpf?: boolean
          require_payment_choice?: boolean
          require_shipping_choice?: boolean
          show_out_of_stock?: boolean
          slogan?: string | null
          slug?: string
          slug_last_updated_at?: string | null
          social_links?: Json
          updated_at?: string
          whatsapp_button_enabled?: boolean
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          plan_id: Database["public"]["Enums"]["plan_id"]
          status: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          plan_id?: Database["public"]["Enums"]["plan_id"]
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          plan_id?: Database["public"]["Enums"]["plan_id"]
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_seller_by_email: {
        Args: { target_email: string; target_store: string }
        Returns: string
      }
      admin_delete_store: { Args: { p_store_id: string }; Returns: undefined }
      admin_get_platform_stats: { Args: never; Returns: Json }
      admin_get_store_detail: { Args: { p_store_id: string }; Returns: Json }
      admin_get_stores_list: {
        Args: never
        Returns: {
          created_at: string
          current_period_end: string
          id: string
          last_payment_at: string
          name: string
          owner_email: string
          owner_name: string
          plan_id: string
          plan_status: string
          product_count: number
          seller_count: number
          slug: string
          trial_ends_at: string
        }[]
      }
      admin_grant_complimentary: {
        Args: {
          p_expires_at: string
          p_notes?: string
          p_plan_id: Database["public"]["Enums"]["plan_id"]
          p_store_id: string
        }
        Returns: undefined
      }
      can_add_featured_product: {
        Args: { p_store_id: string }
        Returns: boolean
      }
      create_catalog_order: {
        Args: {
          p_coupon_id?: string
          p_customer_name: string
          p_customer_notes?: string
          p_customer_phone: string
          p_items?: Json
          p_store_id: string
        }
        Returns: Json
      }
      get_user_role: { Args: { p_store_id: string }; Returns: string }
      get_user_stores: {
        Args: never
        Returns: {
          store_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_store_member: { Args: { target_store: string }; Returns: boolean }
      record_coupon_usage: {
        Args: { target_coupon: string }
        Returns: undefined
      }
      store_catalog_status: {
        Args: { target_store: string }
        Returns: {
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string
        }[]
      }
      validate_coupon: {
        Args: {
          coupon_code: string
          subtotal_in_cents: number
          target_store: string
        }
        Returns: {
          category_id: string
          code: string
          description: string
          discount_in_cents: number
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          expires_at: string
          id: string
          min_subtotal_in_cents: number
        }[]
      }
    }
    Enums: {
      coupon_discount_type: "percent" | "fixed"
      notification_type:
        | "order_new"
        | "payment_failed"
        | "low_stock"
        | "seller_added"
        | "subscription_event"
      order_status: "pending" | "confirmed" | "cancelled" | "completed"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "credit_card"
        | "debit_card"
        | "pix"
        | "boleto"
        | "payment_link"
      plan_id: "basico" | "pro" | "premium"
      product_sort_order:
        | "recent"
        | "name_asc"
        | "name_desc"
        | "price_asc"
        | "price_desc"
      shipping_method:
        | "delivery"
        | "pickup_in_store"
        | "room_service"
        | "digital"
      store_role: "owner" | "seller"
      subscription_status:
        | "none"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      coupon_discount_type: ["percent", "fixed"],
      notification_type: [
        "order_new",
        "payment_failed",
        "low_stock",
        "seller_added",
        "subscription_event",
      ],
      order_status: ["pending", "confirmed", "cancelled", "completed"],
      payment_method: [
        "cash",
        "bank_transfer",
        "credit_card",
        "debit_card",
        "pix",
        "boleto",
        "payment_link",
      ],
      plan_id: ["basico", "pro", "premium"],
      product_sort_order: [
        "recent",
        "name_asc",
        "name_desc",
        "price_asc",
        "price_desc",
      ],
      shipping_method: [
        "delivery",
        "pickup_in_store",
        "room_service",
        "digital",
      ],
      store_role: ["owner", "seller"],
      subscription_status: [
        "none",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
    },
  },
} as const
