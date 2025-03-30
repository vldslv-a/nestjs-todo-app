import { IS_PUBLIC_KEY, Public } from './public.decorator';

import 'reflect-metadata';

describe('Public Decorator', () => {
  it('should set metadata with the correct key and value', () => {
    const testFunction = () => {};
    const decorator = Public();

    decorator(testFunction);

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, testFunction);
    expect(metadata).toBe(true);
  });
});
