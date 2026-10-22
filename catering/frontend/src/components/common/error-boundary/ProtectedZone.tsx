'use client';

import React, { ReactNode } from 'react';
import { MicroErrorBoundary } from './MicroErrorBoundary';

interface ProtectedZoneProps {
  children: ReactNode;
}

export function ProtectedZone({ children }: ProtectedZoneProps) {
  const protectChildren = (nodes: ReactNode): ReactNode => {
    return React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;

      // Wrap only custom function or object components with capitalized names.
      const isCustomComponent = typeof child.type === 'function' || typeof child.type === 'object';

      if (isCustomComponent) {
        return (
          <MicroErrorBoundary name={(child.type as any).displayName || (child.type as any).name || 'Component'}>
            {child}
          </MicroErrorBoundary>
        );
      }

      // Recursively inspect children of standard DOM elements such as div, form and label.
      const childProps = child.props as any;
      if (childProps && childProps.children) {
        return React.cloneElement(child, {
          children: protectChildren(childProps.children),
        } as any);
      }

      return child;
    });
  };

  return <>{protectChildren(children)}</>;
}
