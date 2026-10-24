import { useMemo } from 'react'
export default function useBookStats(books) { return useMemo(() => ({ total: books.length, owned: books.filter((b) => b.status === 'owned').length, reading: books.filter((b) => b.status === 'reading').length, wishlist: books.filter((b) => b.status === 'wishlist').length, read: books.filter((b) => b.status === 'read').length }), [books]) }
