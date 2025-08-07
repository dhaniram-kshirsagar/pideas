/// <reference types="react-scripts" />

// Add React type declarations if @types/react is not installed
declare module 'react' {
  export = React;
}

declare module 'react/jsx-runtime' {
  export = JSX;
}

declare namespace React {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Add any custom attributes here
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
