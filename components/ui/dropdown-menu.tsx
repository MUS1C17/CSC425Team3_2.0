import React from "react";

export const DropdownMenu = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DropdownMenuContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DropdownMenuItem = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DropdownMenuLabel = ({ children, ...props }: any) => <div {...props}>{children}</div>;
export const DropdownMenuSeparator = ({ ...props }: any) => <hr {...props} />;
export const DropdownMenuTrigger = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const DropdownMenuRadioGroup = ({ children, value, onValueChange, ...props }: any) => 
(
	<div {...props} role="radiogroup">{children}</div>
);

export const DropdownMenuRadioItem = ({ children, value, className = "", ...props }: any) => 
(
	<div {...props} role="radio" data-value={value} className={className}>
		{children}
	</div>
);

export default DropdownMenu;
