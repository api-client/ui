/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { noChange, nothing, PropertyPart, } from 'lit';
import { directive, Directive, PartInfo, PartType } from 'lit/directive.js';

class IfPropertyDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.PROPERTY) {
      throw new Error('ifProperty() can only be used in a property setter');
    }
  }

  override update(part: PropertyPart, [props]: any[]): any {
    if (props === undefined) {
      return noChange;
    }
    return props;
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
