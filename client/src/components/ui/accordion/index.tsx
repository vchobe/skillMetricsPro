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
    data-accordion-item="true"
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
      console.log('Down arrow pressed');
      
      // First try to navigate to child if open
      if (currentState === "open") {
        const content = currentElement.closest('[data-accordion-item]')?.querySelector('[role="region"]');
        if (content) {
          console.log('Item is open with content');
          const childTrigger = content.querySelector('[data-accordion-trigger]');
          if (childTrigger && childTrigger instanceof HTMLElement) {
            console.log('Found child trigger, focusing');
            childTrigger.focus();
            return;
          }
        }
      }
      
      // If no child or not open, try to find next sibling
      console.log('Looking for next sibling');
      const currentItem = currentElement.closest('[data-accordion-item]');
      if (currentItem) {
        console.log('Found current item', currentItem);
        const nextItem = currentItem.nextElementSibling;
        
        if (nextItem) {
          console.log('Found next item', nextItem);
          const nextTrigger = nextItem.querySelector('[data-accordion-trigger]');
          if (nextTrigger && nextTrigger instanceof HTMLElement) {
            console.log('Found next trigger, focusing');
            nextTrigger.focus();
            return;
          }
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      console.log('Up arrow pressed');
      
      // First try to find previous sibling
      const currentItem = currentElement.closest('[data-accordion-item]');
      if (currentItem) {
        console.log('Found current item', currentItem);
        const prevItem = currentItem.previousElementSibling;
        
        if (prevItem) {
          console.log('Found previous item', prevItem);
          const prevTrigger = prevItem.querySelector('[data-accordion-trigger]');
          if (prevTrigger && prevTrigger instanceof HTMLElement) {
            console.log('Found previous trigger, focusing');
            prevTrigger.focus();
            return;
          }
        } else {
          // If no previous sibling, go up to parent
          console.log('No previous sibling, looking for parent');
          const accordionContent = currentItem.closest('[role="region"]');
          if (accordionContent) {
            console.log('Found parent content', accordionContent);
            const parentItem = accordionContent.closest('[data-accordion-item]');
            if (parentItem) {
              console.log('Found parent item', parentItem);
              const parentTrigger = parentItem.querySelector('[data-accordion-trigger]');
              if (parentTrigger && parentTrigger instanceof HTMLElement) {
                console.log('Found parent trigger, focusing');
                parentTrigger.focus();
                return;
              }
            }
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
        data-accordion-trigger="true"
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