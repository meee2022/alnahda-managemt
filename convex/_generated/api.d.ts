/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academics from "../academics.js";
import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as aiExtract from "../aiExtract.js";
import type * as analytics from "../analytics.js";
import type * as classVisits from "../classVisits.js";
import type * as development from "../development.js";
import type * as evaluations from "../evaluations.js";
import type * as files from "../files.js";
import type * as guidePlans from "../guidePlans.js";
import type * as meetings from "../meetings.js";
import type * as performance from "../performance.js";
import type * as plans from "../plans.js";
import type * as recommendationSeed from "../recommendationSeed.js";
import type * as registers from "../registers.js";
import type * as reports from "../reports.js";
import type * as seedData from "../seedData.js";
import type * as students from "../students.js";
import type * as teachers from "../teachers.js";
import type * as timetable from "../timetable.js";
import type * as visits from "../visits.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academics: typeof academics;
  admin: typeof admin;
  ai: typeof ai;
  aiExtract: typeof aiExtract;
  analytics: typeof analytics;
  classVisits: typeof classVisits;
  development: typeof development;
  evaluations: typeof evaluations;
  files: typeof files;
  guidePlans: typeof guidePlans;
  meetings: typeof meetings;
  performance: typeof performance;
  plans: typeof plans;
  recommendationSeed: typeof recommendationSeed;
  registers: typeof registers;
  reports: typeof reports;
  seedData: typeof seedData;
  students: typeof students;
  teachers: typeof teachers;
  timetable: typeof timetable;
  visits: typeof visits;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
