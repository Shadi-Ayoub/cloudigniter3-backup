export interface CiFormFieldProps {
  name: string;
  label?: string;
  iconType?: 'error' | 'warning';
  className?: string;
  inputType?: string;
  direction?: 'ltr' | 'rtl';
  [key: string]: any;
}
