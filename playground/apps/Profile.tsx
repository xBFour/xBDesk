import { useState } from 'react';
import { Avatar, Badge, Button, Card, DataTable, Field, Input, Select, Switch, Tabs, Toolbar, ToolbarSpacer, useDesktop } from 'xbdesk';
import { useDemoUser } from '../session';

// Örnek kullanıcı profili: kitin bileşenleriyle kurulmuş bir ekran şablonu.

const SESSIONS = [
  { id: 1, device: 'Chrome · Windows 11', place: 'İzmir', last: 'Şu an', current: true },
  { id: 2, device: 'Safari · iPhone', place: 'İzmir', last: 'Dün 18:42', current: false },
  { id: 3, device: 'Firefox · Ubuntu', place: 'Ankara', last: '21 Eylül 09:15', current: false },
];

function InfoTab() {
  const api = useDesktop();
  const user = useDemoUser();
  const [first, last] = user.name.split(' ');
  return (
    <form
      className="demo-profile__form"
      onSubmit={(e) => {
        e.preventDefault();
        api.notify({ title: 'Profil kaydedildi', body: 'Örnek — veriler kaydedilmedi.', timeout: 3000 });
      }}
    >
      <Field label="Ad" inline>
        <Input defaultValue={first} />
      </Field>
      <Field label="Soyad" inline>
        <Input defaultValue={last} />
      </Field>
      <Field label="E-posta" inline hint="Bildirimler bu adrese gönderilir">
        <Input type="email" defaultValue={user.email} />
      </Field>
      <Field label="Telefon" inline>
        <Input type="tel" placeholder="+90 5xx xxx xx xx" />
      </Field>
      <Field label="Dil" inline>
        <Select defaultValue="tr" options={[{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }, { value: 'de', label: 'Deutsch' }]} />
      </Field>
      <Toolbar>
        <ToolbarSpacer />
        <Button type="submit" variant="primary">
          Kaydet
        </Button>
      </Toolbar>
    </form>
  );
}

function SecurityTab() {
  const api = useDesktop();
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);
  const mismatch = again && next !== again ? 'Şifreler eşleşmiyor' : undefined;
  const weak = next && next.length < 8 ? 'En az 8 karakter olmalı' : undefined;
  return (
    <div className="demo-profile__stack">
      <Card title="Şifre değiştir">
        <form
          className="demo-profile__form"
          onSubmit={(e) => {
            e.preventDefault();
            setNext('');
            setAgain('');
            api.notify({ title: 'Şifre güncellendi', body: 'Örnek işlem.', timeout: 3000 });
          }}
        >
          <Field label="Mevcut şifre" inline>
            <Input type="password" autoComplete="current-password" />
          </Field>
          <Field label="Yeni şifre" inline error={weak}>
            <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field label="Yeni şifre (tekrar)" inline error={mismatch}>
            <Input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
          </Field>
          <Toolbar>
            <ToolbarSpacer />
            <Button type="submit" variant="primary" disabled={!next || !!weak || !!mismatch}>
              Şifreyi güncelle
            </Button>
          </Toolbar>
        </form>
      </Card>
      <Card title="İki adımlı doğrulama" description="Girişte telefonunuza gelen kod da istenir." actions={<Switch checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} aria-label="İki adımlı doğrulama" />} />
      <Card title="Açık oturumlar" flush>
        <DataTable
          rows={SESSIONS}
          rowKey={(r) => r.id}
          pageSize={0}
          dense
          columns={[
            { key: 'device', header: 'Cihaz', cell: (r) => <>{r.device} {r.current && <Badge tone="success">Bu cihaz</Badge>}</> },
            { key: 'place', header: 'Konum' },
            { key: 'last', header: 'Son etkinlik', nowrap: true, sortable: false },
            { key: 'end', header: '', sortable: false, align: 'right', cell: (r) => (r.current ? null : <Button size="sm" variant="ghost">Sonlandır</Button>) },
          ]}
        />
      </Card>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="demo-profile__stack">
      <Switch label="Yeni sipariş geldiğinde bildir" defaultChecked />
      <Switch label="Gecikmiş ödemeler için günlük özet" defaultChecked />
      <Switch label="Aktarım hatalarında e-posta gönder" />
      <Switch label="Haftalık rapor e-postası" />
    </div>
  );
}

export function ProfileApp() {
  const api = useDesktop();
  const user = useDemoUser();
  return (
    <div className="demo-profile">
      <header className="demo-profile__header">
        <Avatar name={user.name} size={72} status="online" />
        <div>
          <h2>{user.name}</h2>
          <p>
            {user.email} · <Badge tone="accent">{user.role}</Badge>
          </p>
        </div>
      </header>
      <Tabs
        tabs={[
          { id: 'info', label: 'Bilgiler', content: <InfoTab /> },
          { id: 'security', label: 'Güvenlik', content: <SecurityTab /> },
          { id: 'notifications', label: 'Bildirimler', content: <NotificationsTab /> },
          {
            id: 'appearance',
            label: 'Görünüm',
            content: (
              <Button variant="primary" onClick={() => api.openApp('settings', { section: 'appearance' })}>
                Tema ve duvar kağıdı ayarlarını aç
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
