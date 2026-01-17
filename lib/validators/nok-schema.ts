import { z } from "zod";

export const NextOfKinRelationshipEnum = z.enum(["SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"]);

export const NextOfKinSchema = z.object({
    id: z.string().optional(), // Needed for updates
    fullName: z.string().min(3, "Name must be at least 3 characters."),
    relationship: NextOfKinRelationshipEnum,
    phoneNumber: z.string().regex(
        /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(4[0-1]))[0-9]{6})$/,
        "Please enter a valid Safaricom/Airtel number starting with 07 or 01."
    ),
    allocation: z.coerce.number().min(1, "Allocation must be at least 1%.").max(100, "Allocation cannot exceed 100%."),
    nationality: z.string().default("KE"),
    altPhone: z.string().optional().nullable(),
});

export type NextOfKinInput = z.infer<typeof NextOfKinSchema>;
