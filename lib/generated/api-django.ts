/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * * `pending` - En cours de vérification
 * * `rejected` - Rejeté
 * * `moderation` - En modération
 * * `published` - Publié
 * * `in_progress` - Pris en charge
 * * `resolved` - Résolu
 */
export type ReportStatusEnum =
  | "pending"
  | "rejected"
  | "moderation"
  | "published"
  | "in_progress"
  | "resolved";

/**
 * * `web` - Web
 * * `whatsapp` - WhatsApp
 */
export type ChannelEnum = "web" | "whatsapp";

/**
 * * `in_progress` - in_progress
 * * `resolved` - resolved
 */
export type AgentStatusEnum = "in_progress" | "resolved";

export interface AfterPhotoRequest {
  /** @format binary */
  photo: File;
  /**
   * @maxLength 280
   * @default ""
   */
  note?: string;
}

/** Vue de l'agent : le détail public + ce dont la mairie a besoin pour traiter (verdict IA, canal). */
export interface AgentReport {
  /** @maxLength 12 */
  tracking_code: string;
  category: string;
  category_label: string;
  /**
   * * `pending` - En cours de vérification
   * * `rejected` - Rejeté
   * * `moderation` - En modération
   * * `published` - Publié
   * * `in_progress` - Pris en charge
   * * `resolved` - Résolu
   */
  status?: ReportStatusEnum;
  /** @maxLength 280 */
  description?: string;
  /** @format double */
  lat: number;
  /** @format double */
  lng: number;
  photo_url: string;
  photo_after_url: string | null;
  /**
   * @min 0
   * @max 2147483647
   */
  support_count?: number;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
  /** @format date-time */
  resolved_at?: string | null;
  history: StatusChange[];
  /**
   * * `web` - Web
   * * `whatsapp` - WhatsApp
   */
  channel?: ChannelEnum;
  ai_verdict?: any;
}

export interface AgentReportList {
  count: number;
  results: AgentReport[];
}

export interface CaptureSessionCreated {
  token: string;
  /** @format date-time */
  expires_at: string;
  capture_url: string;
}

export interface CaptureSessionState {
  valid: boolean;
  /** @format date-time */
  expires_at: string;
}

export interface Category {
  /**
   * @maxLength 50
   * @pattern ^[-a-zA-Z0-9_]+$
   */
  slug: string;
  /**
   * Libellé
   * @maxLength 80
   */
  label: string;
  services: string[];
  /** Passe par la modération */
  needs_moderation?: boolean;
}

export interface Health {
  status: string;
  database: string;
  postgis: string;
}

export interface LoginRequest {
  /** @minLength 1 */
  username: string;
  /** @minLength 1 */
  password: string;
}

export interface LoginResult {
  token: string;
  user: LoginUser;
}

export interface LoginUser {
  username: string;
  services: string[];
}

export interface PatchedAgentStatusRequest {
  /**
   * * `in_progress` - in_progress
   * * `resolved` - resolved
   */
  status?: AgentStatusEnum;
  /**
   * @maxLength 280
   * @default ""
   */
  note?: string;
}

export interface ReportCreateRequest {
  /**
   * Slug de la catégorie, ex. depot_sauvage
   * @minLength 1
   */
  category: string;
  /**
   * @maxLength 280
   * @default ""
   */
  description?: string;
  /**
   * Photo prise sur place (JPEG, PNG ou WebP, 8 Mo max)
   * @format binary
   */
  photo: File;
  /**
   * Latitude du point du problème
   * @format double
   * @min -90
   * @max 90
   */
  point_lat: number;
  /**
   * Longitude du point du problème
   * @format double
   * @min -180
   * @max 180
   */
  point_lng: number;
  /**
   * Latitude du téléphone
   * @format double
   * @min -90
   * @max 90
   */
  device_lat: number;
  /**
   * Longitude du téléphone
   * @format double
   * @min -180
   * @max 180
   */
  device_lng: number;
  /**
   * Précision GPS du téléphone, en mètres
   * @format double
   * @min 0
   */
  device_accuracy_m: number;
  /** @default "" */
  capture_token?: string;
}

/** Réponse de POST /reports (documentation du contrat). */
export interface ReportCreated {
  tracking_code: string;
  status: string;
  duplicate: boolean;
  support_count: number;
  message: string;
}

/** Suivi citoyen : détail public d'un signalement. */
export interface ReportDetail {
  /** @maxLength 12 */
  tracking_code: string;
  category: string;
  category_label: string;
  /**
   * * `pending` - En cours de vérification
   * * `rejected` - Rejeté
   * * `moderation` - En modération
   * * `published` - Publié
   * * `in_progress` - Pris en charge
   * * `resolved` - Résolu
   */
  status?: ReportStatusEnum;
  /** @maxLength 280 */
  description?: string;
  /** @format double */
  lat: number;
  /** @format double */
  lng: number;
  photo_url: string;
  photo_after_url: string | null;
  /**
   * @min 0
   * @max 2147483647
   */
  support_count?: number;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
  /** @format date-time */
  resolved_at?: string | null;
  history: StatusChange[];
}

export interface StatusChange {
  /** @maxLength 12 */
  from_status?: string;
  /** @maxLength 12 */
  to_status: string;
  /** @maxLength 280 */
  note?: string;
  /** @format date-time */
  at: string;
}

export interface WebhookAck {
  status: string;
}

export type WebhooksWhatsappCreatePayload = Record<string, any>;
