# shadcn/ui Complete Component Reference

> One-line descriptions, interaction patterns, and the implementation detail you would miss from the visual design alone.
> 59 components. Current as of shadcn/ui latest (April 2026).

---

## Notation Key

- **Radix** = built on Radix UI primitives (accessible, unstyled headless components)
- **Composition** = not a single import; you assemble it from sub-components
- **Controlled** = supports `value`/`onValueChange` for external state management
- **Imperative** = triggered by calling a function, not by rendering JSX

---

## DATA DISPLAY

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 1 | **Accordion** | Vertically stacked collapsible sections. | Radix. Composition: `Accordion > AccordionItem > AccordionTrigger + AccordionContent`. Controlled via `value`/`onValueChange`. | Must set `type="single"` or `type="multiple"` -- this controls whether one or many items can be open simultaneously. Single-type requires `collapsible` prop to allow closing all items. |
| 2 | **Avatar** | Image element with fallback for user profile photos. | Radix. Composition: `Avatar > AvatarImage + AvatarFallback`. | Fallback is not a prop -- it is a separate child component that renders automatically when the image fails to load. You must provide both `AvatarImage` and `AvatarFallback` as children. |
| 3 | **Badge** | Small status label rendered as an inline element. | Variants via `variant` prop: `default`, `secondary`, `destructive`, `outline`. | This is a styled `<span>`, not a Radix primitive. Uses `class-variance-authority` (cva) under the hood for variant management. |
| 4 | **Card** | Container for grouped content with header, body, and footer sections. | Composition: `Card > CardHeader + CardTitle + CardDescription + CardContent + CardFooter`. | Pure styled divs with no behavioral logic. No Radix dependency. You compose the layout yourself -- there is no "content" prop, everything is children-based composition. |
| 5 | **Chart** | Themed wrapper system for building data visualizations. | Built on **Recharts** (v3.8.0). Uses a `ChartConfig` object to decouple labels/colors from data. Composition: `ChartContainer > [Recharts components] + ChartTooltip + ChartLegend`. | Not a chart component itself -- it is a theming/config layer around Recharts. You still write Recharts JSX (`<BarChart>`, `<LineChart>`, etc.) inside `ChartContainer`. Colors use CSS variables (`var(--color-KEY)`). Supports area, bar, line, pie, radar, and radial chart types. |
| 6 | **Data Table** | Guide/pattern for building sortable, filterable, paginated tables. | Built on **TanStack Table** (headless). You define `ColumnDef<T>[]`, wire up `useReactTable()`, and render into the `Table` component. | This is NOT an installable component -- it is a documentation recipe. You must install TanStack Table separately, define column definitions, and compose your own `DataTable` component using the `Table` UI primitive. Sorting, filtering, pagination, and row selection each require explicit opt-in via `getSortedRowModel()`, `getFilteredRowModel()`, etc. |
| 7 | **Empty** | Placeholder content for zero-data / empty states. | Composition: `Empty > EmptyHeader > EmptyMedia + EmptyTitle + EmptyDescription` + `EmptyContent` for actions. | Not a Radix component. Has a `variant` on `EmptyMedia` (`"default"` vs `"icon"`). You compose the empty state yourself -- it does not auto-detect empty data. |
| 8 | **Item** | Versatile row/list-item for displaying content with media, title, description, and actions. | Composition: `Item > ItemMedia + ItemContent > ItemTitle + ItemDescription` + `ItemActions`. Supports `ItemGroup` for lists. Variants: `default`, `outline`, `muted`. | This is a layout primitive, not a Radix component. Use it for lists, settings rows, or any content that follows the "icon + text + action" pattern. Has size variants (`default`, `sm`, `xs`). |
| 9 | **Skeleton** | Animated placeholder that mimics content shape while loading. | Apply directly as a styled `<div>` with width/height to match the loading content shape. | No props for content shape -- you must manually size each skeleton to match the expected rendered content. Often used inside cards or lists. Purely CSS-based animation, no JS logic. |
| 10 | **Table** | Styled HTML table with header, body, row, head, and cell sub-components. | Composition: `Table > TableHeader > TableRow > TableHead` + `TableBody > TableRow > TableCell` + optional `TableFooter`, `TableCaption`. | These are thin styled wrappers around native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` elements. No sorting, filtering, or pagination built in -- for that, use the Data Table pattern with TanStack Table. |
| 11 | **Typography** | Collection of Tailwind utility class patterns for text styling. | Not a component. Apply utility classes directly to HTML elements: `h1` through `h4`, `p`, `blockquote`, `ul`, `code`, etc. | There is no `<Typography>` component to import. This is a documentation page showing recommended Tailwind class combinations (e.g., `text-4xl font-extrabold tracking-tight lg:text-5xl` for h1). Copy the classes, not a component. |

---

## FORMS & INPUTS

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 12 | **Button** | Clickable action element with multiple visual variants. | Radix (`Slot` for `asChild`). Variants via cva: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default`, `sm`, `lg`, `icon`. | The `asChild` prop is critical -- it lets you render the button styles on a child element (e.g., a Next.js `<Link>`). Without it, nesting `<a>` inside `<button>` creates invalid HTML. |
| 13 | **Button Group** | Container that groups related buttons with consistent styling and spacing. | Composition: `ButtonGroup > Button + ButtonGroupSeparator + ButtonGroupText`. Props: `orientation` (`horizontal`/`vertical`). | Has `role="group"` for accessibility. Supports split-button patterns (primary action + dropdown). Can wrap non-button elements like `Input`, `Select`, and `Popover` -- not just buttons. |
| 14 | **Checkbox** | Toggle control for boolean or indeterminate state. | Radix. Controlled via `checked`/`onCheckedChange`. Supports `indeterminate` state. | `onCheckedChange` returns `boolean | "indeterminate"`, not a DOM event. You cannot use `onChange` from React -- you must use the Radix `onCheckedChange` handler. |
| 15 | **Combobox** | Autocomplete input with searchable dropdown suggestions. | Built on **Base UI** (not Radix). Composition: `Combobox > ComboboxInput + ComboboxContent > ComboboxList > ComboboxItem`. Also: `ComboboxEmpty`, `ComboboxChips`, `ComboboxGroup`. | Switched from Radix + cmdk composition to Base UI as the underlying primitive. Filtering is built-in and automatic. Multi-select uses `ComboboxChips` + `ComboboxChipsInput`. The `itemToStringValue` prop handles non-string option data. |
| 16 | **Date Picker** | Date selection with optional range and presets support. | Composition pattern (NOT a single component): `Popover > PopoverTrigger + PopoverContent > Calendar`. Dependencies: `react-day-picker`, `date-fns`. | There is no `<DatePicker>` component in the registry. You build it yourself by composing `Popover` + `Calendar`. Date range selection requires using `Calendar` in `mode="range"` with a `DateRange` state object. |
| 17 | **Field** | Accessible form field composition with label, control, description, and error. | Composition: `FieldSet > FieldLegend + FieldGroup > Field > FieldLabel + [control] + FieldDescription + FieldError`. Also: `FieldContent`, `FieldSeparator`. | This is the layout/accessibility layer -- it does NOT handle form state or validation. Pair it with React Hook Form or TanStack Form for state management. Provides `orientation` prop for horizontal vs vertical layout. Different from `Form` which bundles validation. |
| 18 | **Form** | Form state management integration with validation and accessible error handling. | Dependencies: **React Hook Form** + **Zod** (or **TanStack Form** + Zod). Composition: `Form > FormField > FormItem > FormLabel + FormControl + FormDescription + FormMessage`. | Installs React Hook Form and Zod as dependencies. `FormField` uses render props (`render={({ field }) => ...}`). `FormControl` spreads ARIA attributes automatically. You must define a Zod schema and pass it to `useForm` via `zodResolver`. Not just styled inputs -- it is a complete form state + validation system. |
| 19 | **Input** | Styled text input element. | Standard `<input>` with Tailwind styling. Supports all native input attributes. | This is literally a styled `<input>` element with `React.forwardRef`. No Radix dependency, no custom logic. For groups of inputs with addons, use `InputGroup` instead. |
| 20 | **Input Group** | Wrapper that adds addons, buttons, and helper content around inputs. | Composition: `InputGroup > InputGroupInput + InputGroupAddon + InputGroupButton + InputGroupText`. Addon `align` prop: `inline-start`, `inline-end`, `block-start`, `block-end`. | DOM order matters: `InputGroupAddon` must appear AFTER the input in the DOM for proper focus behavior, regardless of visual position. The `align` prop handles visual placement. Use `InputGroupTextarea` instead of `InputGroupInput` for multi-line variants. |
| 21 | **Input OTP** | One-time password / verification code input with individual digit slots. | Built on **input-otp** library. Composition: `InputOTP > InputOTPGroup > InputOTPSlot` + optional `InputOTPSeparator`. | Each `InputOTPSlot` needs an `index` prop matching its position. `maxLength` on the root controls total digits. Supports `pattern` prop for regex validation. Copy-paste of full codes is handled automatically by the underlying library. |
| 22 | **Label** | Accessible text label for form controls. | Radix. Renders a `<label>` element with consistent styling. | Uses Radix Label primitive for proper `htmlFor` association. Automatically pairs with Radix form controls for accessibility. Minimal component but important for screen reader support. |
| 23 | **Native Select** | Styled wrapper around the browser's native `<select>` element. | Renders actual HTML `<select>` + `<option>` + `<optgroup>`. Components: `NativeSelect > NativeSelectOption` + optional `NativeSelectOptGroup`. | Uses the browser's native dropdown, NOT a custom portal-based dropdown like `Select`. Better mobile UX (native OS picker), better performance, but no custom styling of the dropdown options. Choose this when mobile UX or simplicity matters more than visual customization. |
| 24 | **Radio Group** | Set of mutually exclusive radio options. | Radix. Controlled via `value`/`onValueChange`. Composition: `RadioGroup > RadioGroupItem`. | Like Checkbox, uses `onValueChange` (not `onChange`). Each `RadioGroupItem` needs a `value` prop. The group manages selection state -- individual items do not have their own `checked` prop. |
| 25 | **Select** | Custom-styled dropdown selection menu with portal rendering. | Radix. Controlled via `value`/`onValueChange`. Composition: `Select > SelectTrigger > SelectValue` + `SelectContent > SelectGroup > SelectLabel + SelectItem` + `SelectSeparator`. | Content renders in a portal (outside the DOM tree of the trigger). This means CSS parent selectors will not reach the dropdown. For forms, the Radix Select does not render a native `<select>` -- use `Native Select` if you need native form submission or mobile-optimized pickers. |
| 26 | **Slider** | Range input for selecting a numeric value within a range. | Radix. Controlled via `value`/`onValueChange`. Supports `min`, `max`, `step`. | `value` and `onValueChange` use arrays (`number[]`), not single numbers -- even for a single thumb. For range sliders, pass a two-element array. This array-based API catches people who expect a simple number. |
| 27 | **Switch** | Toggle control styled as an on/off switch. | Radix. Controlled via `checked`/`onCheckedChange`. | Same pattern as Checkbox: uses `onCheckedChange` not `onChange`. Returns `boolean`, not a DOM event. Semantically different from Checkbox (immediate effect vs. form submission). |
| 28 | **Textarea** | Styled multi-line text input. | Standard `<textarea>` with Tailwind styling. Supports all native textarea attributes. | Like Input, this is a thin styled wrapper around a native element. No auto-resize built in -- you must implement that yourself or use a library. |

---

## OVERLAY & MODAL

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 29 | **Alert Dialog** | Modal dialog that interrupts the user and requires an explicit response. | Radix. Composition: `AlertDialog > AlertDialogTrigger + AlertDialogContent > AlertDialogHeader > AlertDialogTitle + AlertDialogDescription` + `AlertDialogFooter > AlertDialogCancel + AlertDialogAction`. | Unlike `Dialog`, Alert Dialog CANNOT be dismissed by clicking the backdrop or pressing Escape. The user MUST choose Cancel or Action. Use this for destructive confirmations, not general modals. Radix makes background content inert for accessibility. |
| 30 | **Dialog** | General-purpose modal overlay for displaying content that requires focus. | Radix. Controlled via `open`/`onOpenChange`. Composition: `Dialog > DialogTrigger + DialogContent > DialogHeader > DialogTitle + DialogDescription` + `DialogFooter`. | `DialogTitle` and `DialogDescription` are required for accessibility (ARIA). Omitting them produces console warnings. Content renders in a portal. Can be dismissed with Escape or backdrop click (unlike Alert Dialog). |
| 31 | **Drawer** | Bottom-sheet / slide-up panel with drag-to-dismiss gesture support. | Built on **Vaul** (by Emil Kowalski). Composition mirrors Dialog: `Drawer > DrawerTrigger + DrawerContent > DrawerHeader > DrawerTitle + DrawerDescription` + `DrawerFooter`. | Vaul is a completely separate library from Radix. Supports swipe-to-dismiss gestures on mobile. Can snap to defined points. On desktop, behaves like a bottom-anchored Sheet. Not the same as Sheet despite visual similarity. |
| 32 | **Hover Card** | Floating content panel that appears on mouse hover over a trigger. | Radix. Composition: `HoverCard > HoverCardTrigger + HoverCardContent`. | Only activates on hover (pointer devices), not on tap/click for mobile. Has `openDelay` and `closeDelay` props for controlling hover timing. Content renders in a portal. Not suitable as a primary interaction on touch devices. |
| 33 | **Popover** | Floating content panel anchored to a trigger element, toggled on click. | Radix. Controlled via `open`/`onOpenChange`. Composition: `Popover > PopoverTrigger + PopoverContent`. | Content renders in a portal. Used as a building block for Date Picker and other composed patterns. Supports `side`, `align`, and `sideOffset` for positioning. Focus is trapped inside when open. |
| 34 | **Sheet** | Slide-out panel anchored to a screen edge. | Built on Radix Dialog primitive. Composition: `Sheet > SheetTrigger + SheetContent > SheetHeader > SheetTitle + SheetDescription` + `SheetFooter`. `side` prop: `top`, `right`, `bottom`, `left`. | This IS a Dialog under the hood (same Radix primitive), extended with slide-from-edge animation. Requires `SheetTitle` for accessibility just like Dialog. Different from Drawer: Sheet uses Radix Dialog, Drawer uses Vaul. Sheet has no drag-to-dismiss gesture. |
| 35 | **Tooltip** | Small floating text label that appears on hover/focus of a trigger element. | Radix. Composition: `TooltipProvider > Tooltip > TooltipTrigger + TooltipContent`. | `TooltipProvider` MUST wrap your app (or at least the tooltip usage area) -- tooltips will not work without it. This is the most common setup mistake. Controls `delayDuration` at the provider level. |

---

## NAVIGATION

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 36 | **Breadcrumb** | Hierarchical path indicator showing the user's location in a site hierarchy. | Composition: `Breadcrumb > BreadcrumbList > BreadcrumbItem > BreadcrumbLink` + `BreadcrumbSeparator` + `BreadcrumbPage` (current page) + `BreadcrumbEllipsis`. | Not a Radix primitive -- uses semantic `<nav>` and `<ol>` elements. `BreadcrumbLink` supports `asChild` for framework router integration (e.g., Next.js `Link`). `BreadcrumbEllipsis` + `DropdownMenu` handles overflow on mobile via a responsive pattern. |
| 37 | **Command** | Searchable command palette / action menu with keyboard navigation. | Built on **cmdk** library. Composition: `Command > CommandInput + CommandList > CommandGroup > CommandItem` + `CommandEmpty` + `CommandSeparator`. Also: `CommandDialog` (modal variant), `CommandShortcut`. | cmdk handles the fuzzy search/filtering automatically as you type -- you do not need to implement filtering yourself. `CommandDialog` is a pre-composed Command + Dialog. Commonly used for `Cmd+K` search patterns. Items are keyboard-navigable out of the box. |
| 38 | **Context Menu** | Right-click menu that appears on secondary pointer interaction. | Radix. Composition: `ContextMenu > ContextMenuTrigger + ContextMenuContent > ContextMenuItem`. Also supports: `ContextMenuSub`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`, `ContextMenuLabel`, `ContextMenuSeparator`. | Triggered by right-click (or long-press on mobile), not by a visible button. The trigger wraps content that becomes the right-click target. Supports nested submenus, checkable items, and radio groups -- same API shape as DropdownMenu. |
| 39 | **Dropdown Menu** | Menu that opens from a button trigger with nested actions and selections. | Radix. Composition: `DropdownMenu > DropdownMenuTrigger + DropdownMenuContent > DropdownMenuItem`. Also: `DropdownMenuSub`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`. | Shares the exact same sub-component API shape as Context Menu (checkbox items, radio groups, submenus, separators). Content renders in a portal. Use `onSelect` on items, not `onClick`. `DropdownMenuShortcut` is display-only -- you must wire keyboard shortcuts separately. |
| 40 | **Menubar** | Horizontal menu bar with dropdown menus, like a desktop application menu. | Radix. Composition: `Menubar > MenubarMenu > MenubarTrigger + MenubarContent > MenubarItem`. Also: `MenubarSub`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarSeparator`, `MenubarShortcut`. | Same sub-component API shape as DropdownMenu and ContextMenu. The distinction is layout: Menubar renders as a persistent horizontal bar with multiple trigger-dropdown pairs (File, Edit, View pattern). Keyboard navigation between menus uses arrow keys. |
| 41 | **Navigation Menu** | Structured site navigation with expandable dropdown sections. | Radix. Composition: `NavigationMenu > NavigationMenuList > NavigationMenuItem > NavigationMenuTrigger + NavigationMenuContent` + `NavigationMenuLink`. | The dropdown content animates and positions itself automatically via Radix. `NavigationMenuLink` supports `asChild` for framework router integration. Has a viewport element that the content renders into -- more complex DOM structure than it appears visually. |
| 42 | **Pagination** | Page navigation controls with previous/next and page number links. | Composition: `Pagination > PaginationContent > PaginationItem > PaginationPrevious + PaginationLink + PaginationNext` + `PaginationEllipsis`. | Not a Radix component. These are styled `<nav>` + `<a>` elements with NO built-in state management. You must manage current page state, total pages, and page change handlers yourself. This is purely a UI kit, not a pagination logic library. |
| 43 | **Sidebar** | Composable application sidebar with collapsible sections and mobile support. | Built on Radix + cva + Lucide. Requires `SidebarProvider` wrapper. Composition: `SidebarProvider > Sidebar > SidebarHeader + SidebarContent > SidebarGroup > SidebarMenu > SidebarMenuItem > SidebarMenuButton` + `SidebarFooter` + `SidebarRail`. | Most complex component in the library. `SidebarProvider` is REQUIRED and manages collapse state via `useSidebar()` hook (exposes `state`, `open`, `setOpen`, `isMobile`, `toggleSidebar`). When using inset variant, main content MUST be wrapped in `SidebarInset`. Has keyboard shortcut support (`Cmd+B` to toggle). `SidebarRail` adds a hover-to-expand edge. |
| 44 | **Tabs** | Tabbed interface for switching between content panels. | Radix. Controlled via `value`/`onValueChange`. Composition: `Tabs > TabsList > TabsTrigger` + `TabsContent`. | Each `TabsTrigger` and `TabsContent` must share a matching `value` string. Content panels are rendered but hidden (not unmounted) by default. Keyboard navigation (arrow keys) between tabs is built in via Radix. |

---

## FEEDBACK & STATUS

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 45 | **Alert** | Static banner for displaying important messages. | Composition: `Alert > AlertTitle + AlertDescription`. Variants: `default`, `destructive`. | Not a Radix component. This is a static, non-dismissible message box. It does not auto-dismiss, animate in, or have a close button by default. For temporary notifications, use Sonner/Toast instead. |
| 46 | **Progress** | Horizontal bar indicating completion percentage. | Radix. Controlled via `value` prop (0-100). | You must update the `value` prop yourself -- there is no built-in animation or auto-incrementing. The visual fill is a child `<div>` with a CSS transform, not a width change. `value={null}` renders an indeterminate state. |
| 47 | **Sonner** | Opinionated toast notification system with imperative API. | Built on **Sonner** library (by Emil Kowalski). Setup: render `<Toaster />` once in your layout. Trigger: `import { toast } from "sonner"` then call `toast("message")`. | Imperative API -- you call `toast()` as a function, not render a component. Must install `<Toaster />` in your root layout or it silently does nothing. Supports `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`. Has `position` prop on Toaster. Depends on `next-themes` for dark mode. Replaces the deprecated Toast component. |
| 48 | **Spinner** | Animated loading indicator icon. | Uses cva for size variants. Default icon: `LoaderIcon` from Lucide (animated spin). | Different from Skeleton: Spinner is a spinning icon for active processing; Skeleton is a placeholder mimicking content shape. Supports placement inside buttons (`data-icon="inline-start"`), badges, and input groups. You can swap the icon for any Lucide icon or custom SVG. |
| 49 | **Toast** | **(DEPRECATED)** Legacy toast notification component. | Deprecated in favor of Sonner. | Do not use. The docs redirect to Sonner. If you see `Toast` in existing code, migrate to Sonner's imperative `toast()` API. |

---

## LAYOUT & STRUCTURE

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 50 | **Aspect Ratio** | Container that maintains a fixed width-to-height ratio. | Radix. Set ratio via `ratio` prop (e.g., `ratio={16/9}`). | Wraps a single child element (usually an image). The child must use `object-cover` + absolute positioning to fill the container. Without proper child styling, the content will not fill the ratio box correctly. |
| 51 | **Collapsible** | Expandable/collapsible content section with a trigger. | Radix. Controlled via `open`/`onOpenChange`. Composition: `Collapsible > CollapsibleTrigger + CollapsibleContent`. | This is the primitive that Accordion is built on. Use Collapsible for single expand/collapse sections. Use Accordion when you have multiple collapsible sections that need coordinated state (single vs. multiple open). |
| 52 | **Direction** | Provider component that sets text direction (LTR/RTL) for the application. | Composition: `DirectionProvider` wrapper + `useDirection()` hook. Set `direction="rtl"` or `direction="ltr"`. | Must be paired with `dir="rtl"` on the `<html>` element. The provider makes direction available via context to all Radix components for proper RTL layout. Without this, Radix popover/menu positioning will be wrong in RTL languages. |
| 53 | **Resizable** | Draggable panel layout with adjustable sizes. | Built on **react-resizable-panels** (v4, by bvaughn). Composition: `ResizablePanelGroup > ResizablePanel + ResizableHandle`. | Panel sizes use percentage strings (e.g., `defaultSize="50%"`), not numbers (changed in v4). `ResizableHandle` accepts `withHandle` prop for a visible drag affordance. Supports both `horizontal` and `vertical` orientation. Keyboard accessible. |
| 54 | **Scroll Area** | Custom-styled scrollbar container that replaces native scrollbars. | Radix. Composition: `ScrollArea > [content] + ScrollBar`. | Replaces native scrollbars with styled ones. `ScrollBar` can be `orientation="vertical"` or `orientation="horizontal"`. The scrollbar is overlaid, not inset -- content does not shift when scrollbar appears. Useful for consistent cross-browser scrollbar styling. |
| 55 | **Separator** | Visual divider line between content sections. | Radix. Props: `orientation` (`horizontal`/`vertical`), `decorative`. | When `decorative={false}`, it renders with `role="separator"` for accessibility. Defaults to horizontal. For vertical separators (e.g., in toolbars), you must explicitly set `orientation="vertical"` and manage the height yourself. |

---

## UTILITY & MISC

| # | Component | What It Is | Key Patterns | What You Would Miss From the Visual Design |
|---|-----------|------------|--------------|---------------------------------------------|
| 56 | **Carousel** | Scrollable content slider with navigation controls. | Built on **Embla Carousel**. Composition: `Carousel > CarouselContent > CarouselItem` + `CarouselPrevious + CarouselNext`. Config via `opts` prop. Plugins via `plugins` prop. | All configuration passes through `opts` to Embla (e.g., `opts={{ align: "start", loop: true }}`). Programmatic control via `setApi` prop which exposes the Embla API instance (`api.selectedScrollSnap()`, `api.scrollSnapList()`). Supports Embla plugins like Autoplay. Vertical orientation supported via `orientation="vertical"` or `opts={{ axis: "y" }}`. |
| 57 | **Kbd** | Inline keyboard key / shortcut display element. | Composition: `Kbd` for single keys, `KbdGroup` for combinations. | Purely visual -- renders a styled `<kbd>` HTML element. Does NOT register keyboard event listeners. You must implement the actual keyboard shortcut handling separately. Use inside tooltips or menu items to display shortcut hints. |
| 58 | **Toggle** | Two-state button that can be on or off. | Radix. Controlled via `pressed`/`onPressedChange`. Variants: `default`, `outline`. | Uses `pressed`/`onPressedChange`, NOT `checked`/`onChange` or `active`/`onClick`. This is a Radix Toggle primitive, semantically different from Button -- it has ARIA `pressed` state. For grouped toggles (like a toolbar), use Toggle Group instead. |
| 59 | **Toggle Group** | Set of toggle buttons where one or multiple can be active. | Radix. Controlled via `value`/`onValueChange`. `type="single"` or `type="multiple"`. Composition: `ToggleGroup > ToggleGroupItem`. | Same `type` pattern as Accordion: `"single"` returns `string`, `"multiple"` returns `string[]`. Each `ToggleGroupItem` needs a `value` prop. This is the correct component for toolbar-style button groups where selection state matters (bold/italic/underline pattern). |

---

## Quick Dependency Map

| Underlying Library | Components That Use It |
|--------------------|----------------------|
| **Radix UI** | Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Label, Menubar, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Sheet, Slider, Switch, Tabs, Toggle, Toggle Group, Tooltip |
| **Base UI** | Combobox |
| **cmdk** | Command |
| **Embla Carousel** | Carousel |
| **input-otp** | Input OTP |
| **react-day-picker** + **date-fns** | Calendar (and Date Picker pattern) |
| **react-resizable-panels** | Resizable |
| **Recharts** | Chart |
| **Sonner** | Sonner (toast) |
| **Vaul** | Drawer |
| **React Hook Form** + **Zod** | Form |
| **class-variance-authority** | Badge, Button, Spinner, Sidebar |
| **No external dependency** | Alert, Breadcrumb, Button Group, Card, Empty, Field, Input, Input Group, Item, Kbd, Native Select, Pagination, Skeleton, Spinner, Table, Textarea |

---

## Components That Are NOT Components

These entries in the shadcn docs are patterns/guides, not installable components:

| Name | What It Actually Is |
|------|-------------------|
| **Data Table** | A documentation recipe for composing TanStack Table + the Table UI component |
| **Date Picker** | A composition pattern using Popover + Calendar (no dedicated component) |
| **Typography** | A page of recommended Tailwind utility class combinations (no component to install) |
| **Toast** | Deprecated -- redirects to Sonner |
