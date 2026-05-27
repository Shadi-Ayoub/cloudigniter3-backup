interface SmartJsonEditorFieldProps {
    name: string;
    label?: string;
    description?: string;
    schema?: any;
    jsonSchema?: {
        uri: string;
        fileMatch: string[];
        schema: object;
    };
    height?: string;
    readOnly?: boolean;
    direction?: "ltr" | "rtl";
}
export declare const CiSmartJsonEditorField: ({ name, label, description, schema, jsonSchema, height, readOnly, direction, }: SmartJsonEditorFieldProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CiSmartJsonEditorField.d.ts.map