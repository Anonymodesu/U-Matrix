import { Node } from './SOM'

test('Node distance calculator', () => {
    const a = new Node(0, 0, [0, 0])
    const b = new Node(0, 1, [0, 1])
    a.neighbours['top-left'] = b

    expect(a.getDistance('top-left')).toBe(1)
})