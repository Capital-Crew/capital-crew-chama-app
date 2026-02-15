'use client'

import React, { createContext, useContext } from 'react';

interface RBACContextType {
    permissions: Record<string, boolean>; // ModuleKey -> Boolean
    isLoading: boolean;
}

const RBACContext = createContext<RBACContextType>({
    permissions: {},
    isLoading: true
});

export const useRBAC = () => useContext(RBACContext);

export function RBACProvider({
    children,
    initialPermissions
}: {
    children: React.ReactNode,
    initialPermissions: Record<string, boolean>
}) {
    return (
        <RBACContext.Provider value={{ permissions: initialPermissions, isLoading: false }}>
            {children}
        </RBACContext.Provider>
    );
}
