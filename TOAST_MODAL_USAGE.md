# Toast and ConfirmModal Usage Guide

This document outlines the consistent usage patterns for toast notifications and ConfirmModal throughout the application.

## Toast Notifications

Toast notifications are used for:
- **Success messages**: `toast.success(message)`
- **Error messages**: `toast.error(message)`
- **Loading states with promises**: `toast.promise(promise, { loading, success, error })`

### Usage Locations

1. **Edit Page** (`src/app/[lang]/edit/[id]/page.tsx`):
   - Error loading latest data
   - Success/error deleting food item

2. **Image Gallery** (`src/components/forms/ImageGallery.tsx`):
   - Success/error uploading images
   - Success/error rescanning images
   - Error when no image available to rescan

3. **New Food Page** (`src/app/[lang]/new-food/page.tsx`):
   - Error during food submission

4. **Manage Page** (`src/app/[lang]/manage/page.tsx`):
   - Error loading foods
   - Loading/success/error deleting food items (using toast.promise)

5. **Home Page** (`src/app/[lang]/HomeClient.tsx`):
   - Error loading foods

6. **Save Food Hook** (`src/hooks/useSaveFood.ts`):
   - Validation errors
   - HFS calculation errors
   - Save errors
   - Loading/success states (using toast.promise)

## ConfirmModal

ConfirmModal is used for:
- **Destructive actions**: Delete operations (variant="danger")
- **Discard changes**: When leaving a page with unsaved changes (variant="info")

### Usage Locations

1. **Edit Page** (`src/app/[lang]/edit/[id]/page.tsx`):
   - Discard changes confirmation (info variant)
   - Delete food item confirmation (danger variant)

2. **Manage Page** (`src/app/[lang]/manage/page.tsx`):
   - Delete food item confirmation (danger variant)

## Removed Patterns

The following patterns have been **removed** and replaced with toast/ConfirmModal:

- ❌ `alert()` - Replaced with `toast.error()` or `toast.success()`
- ❌ `confirm()` - Replaced with `ConfirmModal` component

## Translation Keys

All toast messages and modal content use translation keys from the dictionary files:
- `dict.edit.*` for edit page messages
- `dict.manage.*` for manage page messages
- `dict.home.*` for home page messages
- `dict.addFood.*` for new food page messages
- `dict.common.*` for common messages

## Best Practices

1. **Always use toast for async operations**: Use `toast.promise()` for operations that take time
2. **Use ConfirmModal for destructive actions**: Always confirm before deleting or discarding changes
3. **Provide fallback English text**: All toast/modal messages have English fallbacks
4. **Consistent error handling**: All errors should show toast notifications, not just console.error
5. **User feedback**: Every user action should provide feedback via toast or modal







