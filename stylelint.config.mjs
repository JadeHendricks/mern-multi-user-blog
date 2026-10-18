// Style rules for client/src/styles. Every partial follows them; there is no allowlist and no disable
// comments in the source. The only path exceptions are below: the generic layer (bare elements) and
// the vendor layer (a library class name).
export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    // Specificity: one class per selector, no ids, no element, attribute or combinator chains.
    'selector-max-class': 1,
    'selector-max-id': 0,
    'selector-max-type': 0,
    'selector-max-combinators': 0,
    'selector-max-attribute': 0,
    'declaration-no-important': true,
    'no-descending-specificity': true,
    // Nesting is only for `&` modifiers, `&__element` and `&:hover`, plus @include and @media.
    'max-nesting-depth': [1, { ignoreAtRules: ['include', 'media'] }],
    // BEM: block__element--modifier, lowercase, dash-separated words.
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Expected a BEM class name (block__element--modifier, lowercase)' },
    ],
    'selector-no-vendor-prefix': true,
    'property-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,
    'at-rule-no-vendor-prefix': true,
    'media-feature-name-no-vendor-prefix': true,
  },
  overrides: [
    {
      // The generic layer styles bare elements, so type selectors, combinators and attributes are fine here.
      files: ['client/src/styles/generic/**/*.scss'],
      rules: {
        'selector-max-type': null,
        'selector-max-combinators': null,
        'selector-max-attribute': null,
      },
    },
    {
      // react-toastify's own class names are not ours to rename.
      files: ['client/src/styles/vendor/**/*.scss'],
      rules: { 'selector-class-pattern': null },
    },
  ],
};
