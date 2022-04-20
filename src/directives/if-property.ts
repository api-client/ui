/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { nothing, PropertyPart, } from 'lit';
import { directive, Directive, PartInfo, PartType } from 'lit/directive.js';

class IfPropertyDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.PROPERTY) {
      throw new Error('ifProperty() can only be used in a property setter');
    }
  }

  override update(part: PropertyPart, [props]: any[]): void {
    if (props === undefined) {
      return;
    }
    // @ts-ignore
    part.element[part.name] = props;
    
  }

  render(_value: unknown): typeof nothing {
    // nothing.
    return nothing;
  }
}

/** 
 * Ignores setting a property that is `undefined`.
 * 
 * This only works when setting properties.
 * 
 * @param property
 */
export const ifProperty = directive(IfPropertyDirective) as any;

export type { IfPropertyDirective };
