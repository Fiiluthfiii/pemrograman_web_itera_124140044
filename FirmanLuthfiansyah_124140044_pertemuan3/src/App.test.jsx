import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
beforeEach(() => localStorage.clear())
describe('BookShelf app', () => {
  it('menampilkan koleksi awal dan statistik ringkas', () => { render(<App />); expect(screen.getByText('The Creative Act')).toBeInTheDocument(); expect(screen.getByText('Total koleksi')).toBeInTheDocument(); expect(screen.getByText('4')).toBeInTheDocument() })
  it('dapat mencari buku berdasarkan judul', () => { render(<App />); fireEvent.change(screen.getByLabelText('Cari buku'), { target: { value: 'Atomic' } }); expect(screen.getByText('Atomic Habits')).toBeInTheDocument(); expect(screen.queryByText('The Creative Act')).not.toBeInTheDocument() })
  it('menampilkan pesan validasi saat form kosong', () => { render(<App />); fireEvent.click(screen.getByRole('button', { name: '+ Tambah buku' })); fireEvent.click(screen.getByRole('button', { name: 'Tambahkan buku' })); expect(screen.getByText('Judul wajib diisi.')).toBeInTheDocument(); expect(screen.getByText('Penulis wajib diisi.')).toBeInTheDocument() })
  it('menambah buku baru ke koleksi', async () => { render(<App />); fireEvent.click(screen.getByRole('button', { name: '+ Tambah buku' })); fireEvent.change(screen.getByPlaceholderText('Contoh: Filosofi Teras'), { target: { value: 'Laut Bercerita' } }); fireEvent.change(screen.getByPlaceholderText('Nama penulis'), { target: { value: 'Leila S. Chudori' } }); fireEvent.change(screen.getByPlaceholderText('Non-fiksi'), { target: { value: 'Fiction' } }); fireEvent.click(screen.getByRole('button', { name: 'Tambahkan buku' })); await waitFor(() => expect(screen.getByText('Laut Bercerita')).toBeInTheDocument()) })
  it('berpindah ke halaman statistik', () => { render(<App />); fireEvent.click(screen.getByRole('link', { name: 'Statistik' })); expect(screen.getByRole('heading', { name: /Statistik bacaan/ })).toBeInTheDocument(); expect(screen.getByText('Distribusi koleksi')).toBeInTheDocument() })
})
