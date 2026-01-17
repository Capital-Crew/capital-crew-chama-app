# Glassmorphism Toast Notifications - Quick Reference

## Overview
Modern toast notifications with premium glassmorphism styling using `sonner`.

## Features
✅ Semi-transparent backgrounds with backdrop blur  
✅ Smooth stacking animations  
✅ Dark mode support  
✅ Custom icons with Lucide React  
✅ Action buttons  
✅ Promise-based toasts for async operations  

## Usage

### Import
```tsx
import { toast } from '@/lib/toast'
```

### Basic Examples

**Success Toast**
```tsx
toast.success("Payment Successful", "Your transaction was processed")
```

**Error Toast (Prohibited/Blocked)**
```tsx
toast.error("Transaction Blocked", "Insufficient funds in wallet")
```

**Warning Toast**
```tsx
toast.warning("Pending Approval", "Requires 2 more approvals")
```

**Info Toast**
```tsx
toast.info("System Maintenance", "Scheduled for Sunday 2:00 AM")
```

**Loading Toast**
```tsx
const id = toast.loading("Processing...", "Please wait")
// Later dismiss it
toast.dismiss(id)
```

### With Action Button
```tsx
toast.error(
    "Insufficient Funds",
    "Please add funds to continue",
    {
        action: {
            label: "Add Funds",
            onClick: () => router.push('/wallet')
        }
    }
)
```

### Promise-based (Async Operations)
```tsx
toast.promise(
    submitLoanApplication(),
    {
        loading: "Submitting application...",
        success: "Application submitted!",
        error: "Submission failed"
    }
)
```

### Custom Duration
```tsx
toast.success("Quick message", undefined, { duration: 2000 })
```

## Styling Details

### Glass Effect
- **Background**: `bg-white/80` (light), `bg-black/80` (dark)
- **Blur**: `backdrop-blur-md`
- **Border**: Subtle semi-transparent borders
- **Shadow**: `shadow-2xl` for depth

### Variant Colors
- **Success**: Emerald tint with green icon
- **Error**: Red tint with X icon (for blocked transactions)
- **Warning**: Amber tint with triangle icon
- **Info**: Cyan tint with info icon
- **Loading**: Animated spinner

### Animation
- Toasts slide up and stack on top of previous ones
- Smooth transitions with `duration-300 ease-out`
- 12px gap between stacked toasts

## Demo Component
See `components/examples/ToastDemo.tsx` for interactive examples.

## Configuration
Toast settings are in `components/ui/sonner.tsx`:
- Position: `top-center`
- Default duration: `4000ms`
- Max width: `500px`
- Min width: `400px`
