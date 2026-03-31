import { z } from "zod";

export const outputFormatSchema = z.enum(["text", "json", "raw"]);
export const textOutputFormatSchema = z.enum(["text", "json"]);
export const jsonOutputFormatSchema = z.enum(["json"]);
