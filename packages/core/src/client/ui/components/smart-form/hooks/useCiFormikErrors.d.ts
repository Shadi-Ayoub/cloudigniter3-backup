export type FormErrorEntry = {
    field: string;
    label: string;
    message: string;
    section: string;
};
export type UseFormikErrorsOptions = {
    fieldLabels?: Record<string, string>;
    fieldSectionMap: Record<string, string>;
    translate?: (key: string) => string;
    onTabChange?: (section: string) => void;
};
export declare const useCiFormikErrors: ({ fieldLabels, fieldSectionMap, translate, onTabChange, }: UseFormikErrorsOptions) => {
    formErrors: FormErrorEntry[];
    handleFormError: () => void;
    hasErrorInSection: (sectionId: string) => boolean;
    clearFormErrors: () => void;
};
//# sourceMappingURL=useCiFormikErrors.d.ts.map