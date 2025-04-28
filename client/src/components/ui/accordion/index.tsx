import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>;

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, children, onKeyDown, ...props }, ref) => {
  // This handles keyboard navigation for each accordion item
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const currentElement = e.currentTarget;
    const currentState = currentElement.getAttribute("data-state");
    
    // Left/Right arrows for expanding/collapsing
    if (e.key === "ArrowRight") {
      e.preventDefault();
      // Expand the item if it's closed
      if (currentState === "closed") {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        currentElement.dispatchEvent(clickEvent);
      } 
      // If already open, try to move focus to first child
      else if (currentState === "open") {
        // Find the content area associated with this trigger
        const accordionItem = currentElement.closest('[role="region"]');
        if (accordionItem) {
          // Try to find the first focusable element in the content
          const firstChildTrigger = accordionItem.querySelector('[role="button"]');
          if (firstChildTrigger && firstChildTrigger instanceof HTMLElement) {
            firstChildTrigger.focus();
          }
        }
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      // Collapse the item if it's open
      if (currentState === "open") {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        currentElement.dispatchEvent(clickEvent);
      } 
      // If already closed, try to move focus to parent
      else {
        // Find parent accordion trigger
        const parentAccordionItem = currentElement.closest('[data-state="open"]');
        if (parentAccordionItem) {
          const parentTrigger = parentAccordionItem.querySelector('[role="button"]');
          if (parentTrigger && parentTrigger instanceof HTMLElement) {
            parentTrigger.focus();
          }
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      
      // If item is open, try to move to first child
      if (currentState === "open") {
        const contentRegion = currentElement.parentElement?.nextElementSibling;
        if (contentRegion) {
          const firstChildTrigger = contentRegion.querySelector('[role="button"]');
          if (firstChildTrigger && firstChildTrigger instanceof HTMLElement) {
            firstChildTrigger.focus();
            return;
          }
        }
      }
      
      // Otherwise move to next sibling
      const nextTrigger = currentElement.closest('li')?.nextElementSibling?.querySelector('[role="button"]');
      if (nextTrigger && nextTrigger instanceof HTMLElement) {
        nextTrigger.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      
      // Try to move to previous sibling
      const prevTrigger = currentElement.closest('li')?.previousElementSibling?.querySelector('[role="button"]');
      if (prevTrigger && prevTrigger instanceof HTMLElement) {
        prevTrigger.focus();
      } else {
        // If at the top of the list, move to parent
        const parentItem = currentElement.closest('[role="region"]')?.parentElement?.closest('[data-state="open"]');
        if (parentItem) {
          const parentTrigger = parentItem.querySelector('[role="button"]');
          if (parentTrigger && parentTrigger instanceof HTMLElement) {
            parentTrigger.focus();
          }
        }
      }
    }
    
    // Allow other keyboard handlers to run
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-90 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <ChevronRight className="mr-2 h-4 w-4 shrink-0 transition-transform duration-200" />
        <div className="flex-1">{children}</div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }