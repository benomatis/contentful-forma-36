import React, {
  useEffect,
  useState,
  useRef,
  type MouseEvent,
  type FocusEvent,
  type CSSProperties,
} from 'react';
import { usePopper } from 'react-popper';
import type { Placement } from '@popperjs/core';
import { cx } from 'emotion';
import type * as CSS from 'csstype';
import tokens from '@contentful/f36-tokens';
import { Portal } from '@contentful/f36-utils';
import { Box, useId, type CommonProps } from '@contentful/f36-core';

import { getStyles } from './Tooltip.styles';

export type TooltipPlacement = Placement;

export interface TooltipProps extends CommonProps {
  /**
   * Child nodes to be rendered in the component and that will show the tooltip when they are hovered
   */
  children: React.ReactNode;
  /**
   * HTML element used to wrap the target of the tooltip
   */
  as?: React.ElementType;
  /**
   * Content of the tooltip
   */
  content?: string;
  /**
   * A unique id of the tooltip
   */
  id?: string;
  /**
   * It controls the initial visibility of the tooltip
   */
  isVisible?: boolean;
  /**
   * It sets a max-width for the tooltip
   */
  maxWidth?: number | CSS.Property.MaxWidth;
  /**
   * Set a delay period in milliseconds before hiding the tooltip
   */
  hideDelay?: number;
  /**
   * Function that will be called when target gets blurred
   */
  onBlur?: (evt: FocusEvent) => void;
  /**
   * Function that will be called when target gets focused
   */
  onFocus?: (evt: FocusEvent) => void;
  /**
   * Function that will be called when the user move the mouse out of the target
   */
  onMouseLeave?: (evt: MouseEvent) => void;
  /**
   * Function that will be called when the user move the mouse over of the target
   */
  onMouseOver?: (evt: MouseEvent) => void;
  /**
   * Function that will be called when the user uses a keyboard key on the target
   */
  onKeyDown?: (evt: KeyboardEvent) => void;

  /**
   * It sets the "preferred" position of the tooltip
   */
  placement?: TooltipPlacement;
  /**
   * Set a delay period in milliseconds before showing the tooltip
   */
  showDelay?: number;
  /**
   * Class names to be appended to the className prop of the tooltip’s target
   */
  targetWrapperClassName?: string;
  /**
   * Boolean to control whether or not to render the tooltip in a React Portal.
   * Rendering content inside a Portal allows the tooltip to escape the bounds
   * of its parent while still being positioned correctly. Using a Portal is
   * necessary if an ancestor of the tooltip hides overflow.
   *
   * Defaults to `false`
   */
  usePortal?: boolean;
  /**
   * Prevents showing the tooltip
   * @default false
   */
  isDisabled?: boolean;
}

export const Tooltip = ({
  children,
  className,
  as: HtmlTag = 'span',
  content,
  id,
  isVisible,
  hideDelay = 0,
  onBlur,
  onFocus,
  onMouseLeave,
  onMouseOver,
  onKeyDown,
  showDelay = 0,
  targetWrapperClassName,
  maxWidth = 360,
  testId = 'cf-ui-tooltip',
  placement = 'auto',
  usePortal = false,
  isDisabled = false,
  ...otherProps
}: TooltipProps) => {
  const styles = getStyles();
  const [show, setShow] = useState(false);
  const tooltipId = useId(id, 'tooltip');
  const elementRef = useRef(null);
  const popperRef = useRef(null);
  const [arrowRef, setArrowRef] = useState<HTMLSpanElement | null>(null);
  const {
    styles: popperStyles,
    attributes,
    update,
  } = usePopper(elementRef.current, popperRef.current, {
    placement: placement,
    modifiers: [
      {
        name: 'arrow',
        options: {
          element: arrowRef,
          padding: parseFloat(tokens.borderRadiusSmall),
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  // necessary to update tooltip position in case the content is being updated
  useEffect(() => {
    const updatePosition = async () => {
      if (update !== null) {
        await update();
      }
    };
    updatePosition();
  }, [content, update]);

  const [isHoveringTarget, setIsHoveringTarget] = useState(false);
  const [isHoveringContent, setIsHoveringContent] = useState(false);
  useEffect(() => {
    setShow(isHoveringContent || isHoveringTarget);
  }, [isHoveringTarget, isHoveringContent]);

  useEffect(() => {
    if (isVisible) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentMaxWidth =
    typeof maxWidth === 'string' ? maxWidth : `${maxWidth}px`;

  const contentStyles: CSSProperties = {
    zIndex: tokens.zIndexTooltip,
    maxWidth: contentMaxWidth,
    ...popperStyles.popper,
  };

  if (!content || isDisabled) {
    return (
      <Box as={HtmlTag} className={targetWrapperClassName}>
        {children}
      </Box>
    );
  }

  const tooltip = (
    <Box
      as="span"
      id={tooltipId}
      ref={popperRef}
      role="tooltip"
      style={contentStyles}
      className={cx(styles.tooltip, className)}
      testId={testId}
      onMouseEnter={() => {
        setIsHoveringContent(true);
      }}
      onMouseLeave={() => {
        setIsHoveringContent(false);
      }}
      {...attributes.popper}
    >
      <span>{content}</span>
      <span
        className={styles.tooltipArrow}
        data-placement={
          attributes.popper && attributes.popper['data-popper-placement']
        }
        ref={setArrowRef}
        style={popperStyles.arrow}
      />
    </Box>
  );

  return (
    <>
      {show ? <>{usePortal ? <Portal>{tooltip}</Portal> : tooltip}</> : null}
      <Box
        as={HtmlTag}
        ref={elementRef}
        className={cx(styles.tooltipContainer, targetWrapperClassName)}
        onMouseEnter={(evt: MouseEvent) => {
          setTimeout(() => setIsHoveringTarget(true), showDelay);
          if (onMouseOver) onMouseOver(evt);
        }}
        onMouseLeave={(evt: MouseEvent) => {
          setTimeout(() => setIsHoveringTarget(false), hideDelay);
          if (onMouseLeave) onMouseLeave(evt);
        }}
        onFocus={(evt: FocusEvent) => {
          setTimeout(() => setIsHoveringTarget(true), showDelay);
          if (onFocus) onFocus(evt);
        }}
        onBlur={(evt: FocusEvent) => {
          setTimeout(() => setIsHoveringTarget(false), hideDelay);
          if (onBlur) onBlur(evt);
        }}
        onKeyDown={(evt: KeyboardEvent) => {
          if (evt.key === 'Escape') {
            setTimeout(() => setIsHoveringTarget(false), hideDelay);
          }
          if (onKeyDown) onKeyDown(evt);
        }}
        {...otherProps}
      >
        {React.Children.map<React.ReactNode, React.ReactNode>(
          children,
          (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                'aria-describedby': tooltipId,
              });
            }
          },
        )}
      </Box>
    </>
  );
};
