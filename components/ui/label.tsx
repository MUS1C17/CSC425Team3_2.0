import * as React from "react";

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement> & { children?: React.ReactNode; className?: string }) 
{
    const { children, className = "", ...rest } = props;
    return (
        <label {...rest} className={`block ${className}`}>
        {children}
        </label>
    );
}

export default Label;
