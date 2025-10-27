import React from "react";

export const Card = ({ children, className = "", ...props }: any) => (
    <section {...props} className={`rounded-md p-4 ${className}`}>
        {children}
    </section>
);

export const CardHeader = ({ children, className = "", ...props }: any) => (
    <div {...props} className={`flex items-center justify-between ${className}`}>
        {children}
    </div>
);

export const CardTitle = ({ children, className = "", ...props }: any) => (
    <h3 {...props} className={`text-lg font-semibold ${className}`}>
        {children}
    </h3>
);

export const CardDescription = ({ children, className = "", ...props }: any) => (
    <p {...props} className={`text-sm text-muted-foreground ${className}`}>
        {children}
    </p>
);

export const CardContent = ({ children, className = "", ...props }: any) => (
    <div {...props} className={`${className}`}>
        {children}
    </div>
);

export default Card;
