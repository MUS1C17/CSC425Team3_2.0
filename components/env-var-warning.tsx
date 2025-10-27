import React from "react";

export function EnvVarWarning()
{
    return (
        <div className="text-xs text-amber-700 px-2 py-1 rounded-md bg-amber-100">
        Environment variables not configured — some features may not work.
        </div>
    );
}

export default EnvVarWarning;
