import React from 'react';

import { Paragraph, ParagraphProps } from '../src/Paragraph/Paragraph';

export default {
  title: 'Typography/Paragraph',
  component: Paragraph,
  parameters: {
    propTypes: [Paragraph['__docgenInfo']],
  },
  argTypes: {
    className: { control: { disable: true } },
  },
};

export const Basic = (props: ParagraphProps) => <Paragraph {...props} />;

Basic.args = {
  children: 'Paragraph',
};
