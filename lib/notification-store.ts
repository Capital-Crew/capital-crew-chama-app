import React from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationAction {
    label: string;
    onClick: () => void;
}

export interface NotificationPayload {
    id?: string;
    type: NotificationType;
    title: string;
    message?: React.ReactNode;
    action?: NotificationAction;
    duration?: number;
}

type Listener = (notification: NotificationPayload | null) => void;

let listeners: Listener[] = [];

export const notificationStore = {
    subscribe: (listener: Listener) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    emit: (notification: NotificationPayload | null) => {
        listeners.forEach(listener => listener(notification));
    },

    dismiss: () => {
        listeners.forEach(listener => listener(null));
    }
};
