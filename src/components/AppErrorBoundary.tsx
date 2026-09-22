import { Component, type ReactNode } from 'react';
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="max-w-md mx-auto p-8 space-y-4"><h1 className="text-2xl font-bold">Ruang belajar belum dapat dimuatkan.</h1><p>Semak sambungan internet dan cuba muat semula. Kemajuan yang telah dihantar kekal tersimpan.</p><button className="practice-start text-white p-3 rounded-xl" onClick={() => window.location.reload()}>Muat semula</button></main> : this.props.children; }
}
