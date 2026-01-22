'use client'

import React from 'react';
import { X } from 'lucide-react';
import { MemberProfileView } from './MemberProfileView';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/animation-variants';

interface MemberDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: any;
    stats: any;
    contributions: any[];
    loans: any[];
    nextOfKin: any[];
}

export function MemberDetailModal({
    isOpen,
    onClose,
    member,
    stats,
    contributions,
    loans,
    nextOfKin
}: MemberDetailModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={fadeIn}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                >
                    <motion.div
                        variants={scaleIn}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="flex justify-end p-6 pb-0">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <MemberProfileView
                                member={member}
                                stats={stats}
                                contributions={contributions}
                                loans={loans}
                                nextOfKin={nextOfKin}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
