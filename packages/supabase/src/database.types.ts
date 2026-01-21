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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          guests: number | null
          id: string
          notes: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          guests?: number | null
          id?: string
          notes?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          guests?: number | null
          id?: string
          notes?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          auth_user_id: string | null
          business_name: string
          business_type: string
          created_at: string | null
          email: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          business_name: string
          business_type: string
          created_at?: string | null
          email: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          business_name?: string
          business_type?: string
          created_at?: string | null
          email?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      google_business_locations: {
        Row: {
          account_name: string
          address: string | null
          created_at: string | null
          id: string
          is_selected: boolean | null
          is_verified: boolean | null
          location_name: string
          metadata: Json | null
          phone: string | null
          social_account_id: string | null
          title: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          account_name: string
          address?: string | null
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          is_verified?: boolean | null
          location_name: string
          metadata?: Json | null
          phone?: string | null
          social_account_id?: string | null
          title: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          account_name?: string
          address?: string | null
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          is_verified?: boolean | null
          location_name?: string
          metadata?: Json | null
          phone?: string | null
          social_account_id?: string | null
          title?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_business_locations_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      google_reviews_cache: {
        Row: {
          cached_at: string | null
          comment: string | null
          id: string
          location_id: string | null
          reply_comment: string | null
          reply_updated_at: string | null
          review_created_at: string | null
          review_name: string
          review_updated_at: string | null
          reviewer_name: string | null
          reviewer_photo_url: string | null
          star_rating: number | null
        }
        Insert: {
          cached_at?: string | null
          comment?: string | null
          id?: string
          location_id?: string | null
          reply_comment?: string | null
          reply_updated_at?: string | null
          review_created_at?: string | null
          review_name: string
          review_updated_at?: string | null
          reviewer_name?: string | null
          reviewer_photo_url?: string | null
          star_rating?: number | null
        }
        Update: {
          cached_at?: string | null
          comment?: string | null
          id?: string
          location_id?: string | null
          reply_comment?: string | null
          reply_updated_at?: string | null
          review_created_at?: string | null
          review_name?: string
          review_updated_at?: string | null
          reviewer_name?: string | null
          reviewer_photo_url?: string | null
          star_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_cache_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "google_business_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_cents: number
          sort_order: number | null
          tag: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_cents: number
          sort_order?: number | null
          tag?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_cents?: number
          sort_order?: number | null
          tag?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_automation: {
        Row: {
          auto_audience: string | null
          auto_content_type: string | null
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          default_template_id: string | null
          exclude_recent_days: number | null
          frequency: string
          id: string
          is_enabled: boolean | null
          last_sent_at: string | null
          min_bookings: number | null
          next_scheduled_at: string | null
          send_time: string | null
          timezone: string | null
          total_campaigns_sent: number | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          auto_audience?: string | null
          auto_content_type?: string | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          default_template_id?: string | null
          exclude_recent_days?: number | null
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          min_bookings?: number | null
          next_scheduled_at?: string | null
          send_time?: string | null
          timezone?: string | null
          total_campaigns_sent?: number | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          auto_audience?: string | null
          auto_content_type?: string | null
          created_at?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          default_template_id?: string | null
          exclude_recent_days?: number | null
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          min_bookings?: number | null
          next_scheduled_at?: string | null
          send_time?: string | null
          timezone?: string | null
          total_campaigns_sent?: number | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_automation_default_template_id_fkey"
            columns: ["default_template_id"]
            isOneToOne: false
            referencedRelation: "newsletter_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_automation_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          audience_filter: Json | null
          audience_type: string
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          emails_failed: number | null
          emails_sent: number | null
          error_message: string | null
          html_content: string
          id: string
          name: string
          opened_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          total_recipients: number | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          audience_filter?: Json | null
          audience_type?: string
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          emails_failed?: number | null
          emails_sent?: number | null
          error_message?: string | null
          html_content: string
          id?: string
          name: string
          opened_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          audience_filter?: Json | null
          audience_type?: string
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          emails_failed?: number | null
          emails_sent?: number | null
          error_message?: string | null
          html_content?: string
          id?: string
          name?: string
          opened_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "newsletter_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_campaigns_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          emails_opened: number | null
          emails_received: number | null
          id: string
          is_subscribed: boolean | null
          last_booking_date: string | null
          last_email_at: string | null
          name: string | null
          source: string | null
          subscribed_at: string | null
          total_bookings: number | null
          unsubscribed_at: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          emails_opened?: number | null
          emails_received?: number | null
          id?: string
          is_subscribed?: boolean | null
          last_booking_date?: string | null
          last_email_at?: string | null
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
          total_bookings?: number | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          emails_opened?: number | null
          emails_received?: number | null
          id?: string
          is_subscribed?: boolean | null
          last_booking_date?: string | null
          last_email_at?: string | null
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
          total_bookings?: number | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_templates: {
        Row: {
          created_at: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          preview_text: string | null
          subject: string
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          preview_text?: string | null
          subject: string
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preview_text?: string | null
          subject?: string
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_templates_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_booking_confirmation: boolean | null
          email_new_lead: boolean | null
          id: string
          reminder_24h: boolean | null
          reminder_time: string | null
          updated_at: string | null
          webhook_url: string | null
          website_id: string | null
          whatsapp_booking_confirmation: boolean | null
          whatsapp_new_lead: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_booking_confirmation?: boolean | null
          email_new_lead?: boolean | null
          id?: string
          reminder_24h?: boolean | null
          reminder_time?: string | null
          updated_at?: string | null
          webhook_url?: string | null
          website_id?: string | null
          whatsapp_booking_confirmation?: boolean | null
          whatsapp_new_lead?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_booking_confirmation?: boolean | null
          email_new_lead?: boolean | null
          id?: string
          reminder_24h?: boolean | null
          reminder_time?: string | null
          updated_at?: string | null
          webhook_url?: string | null
          website_id?: string | null
          whatsapp_booking_confirmation?: boolean | null
          whatsapp_new_lead?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string
          menu_item_id: string | null
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name: string
          menu_item_id?: string | null
          order_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string
          menu_item_id?: string | null
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_settings: {
        Row: {
          created_at: string | null
          id: string
          pickup_end_time: string
          pickup_start_time: string
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pickup_end_time?: string
          pickup_start_time?: string
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pickup_end_time?: string
          pickup_start_time?: string
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_settings_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          paid_at: string | null
          pickup_date: string
          pickup_time: string
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          total_amount: number
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          pickup_date: string
          pickup_time: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          total_amount: number
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          pickup_date?: string
          pickup_time?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          total_amount?: number
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          is_open: boolean | null
          kitchen_open: boolean | null
          takeaway_enabled: boolean | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_open?: boolean | null
          kitchen_open?: boolean | null
          takeaway_enabled?: boolean | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_open?: boolean | null
          kitchen_open?: boolean | null
          takeaway_enabled?: boolean | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: true
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          caption: string | null
          content_type: string
          created_at: string | null
          error_message: string | null
          id: string
          media_urls: string[] | null
          post_id: string | null
          post_url: string | null
          published_at: string | null
          scheduled_for: string | null
          social_account_id: string | null
          status: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          caption?: string | null
          content_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          caption?: string | null
          content_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          media_urls?: string[] | null
          post_id?: string | null
          post_url?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          social_account_id?: string | null
          status?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_image: string | null
          account_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          meta: Json | null
          platform: string
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
          website_id: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          account_image?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          meta?: Json | null
          platform: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          account_image?: string | null
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          meta?: Json | null
          platform?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
          website_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          client_id: string | null
          config: Json | null
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          config?: Json | null
          created_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          config?: Json | null
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "websites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_newsletter_send: {
        Args: {
          p_day_of_month: number
          p_day_of_week: number
          p_frequency: string
          p_send_time: string
          p_timezone: string
        }
        Returns: string
      }
      get_newsletter_audience: {
        Args: { p_audience_type: string; p_website_id: string }
        Returns: {
          email: string
          name: string
        }[]
      }
      get_pending_newsletters: {
        Args: never
        Returns: {
          auto_audience: string | null
          auto_content_type: string | null
          created_at: string | null
          day_of_month: number | null
          day_of_week: number | null
          default_template_id: string | null
          exclude_recent_days: number | null
          frequency: string
          id: string
          is_enabled: boolean | null
          last_sent_at: string | null
          min_bookings: number | null
          next_scheduled_at: string | null
          send_time: string | null
          timezone: string | null
          total_campaigns_sent: number | null
          updated_at: string | null
          website_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "newsletter_automation"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_newsletter_sent: {
        Args: { p_automation_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
