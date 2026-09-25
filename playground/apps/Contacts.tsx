import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useDesktop } from 'xbdesk';

// Pencere başına router örneği: her pencerenin kendi geçmişi ve adresi var; tarayıcı adresi değişmez.

export const CONTACTS = [
  { id: 'ayse', name: 'Ayşe Demir', role: 'Muhasebe', city: 'İzmir' },
  { id: 'mehmet', name: 'Mehmet Kaya', role: 'Satış', city: 'Ankara' },
  { id: 'zeynep', name: 'Zeynep Arslan', role: 'Depo', city: 'Bursa' },
  { id: 'can', name: 'Can Yıldız', role: 'Saha satış', city: 'Antalya' },
  { id: 'elif', name: 'Elif Şahin', role: 'Yönetim', city: 'İstanbul' },
];

function ContactList() {
  return (
    <div className="demo-contacts">
      <p className="demo-contacts__hint">
        Bir kişiye tıklayın: pencere kendi içinde detaya gider (useParams). Geri düğmesi pencerenin geçmişini kullanır. "Yeni pencerede" aynı
        uygulamayı başka bir adresle ikinci kez açar.
      </p>
      <ul>
        {CONTACTS.map((c) => (
          <li key={c.id}>
            <Link to={`/kisiler/${c.id}`}>
              <span className="demo-contacts__avatar" aria-hidden="true">
                {c.name[0]}
              </span>
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.role} · {c.city}
                </small>
              </span>
            </Link>
            <OpenInNewWindow path={`/kisiler/${c.id}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpenInNewWindow({ path }: { path: string }) {
  const api = useDesktop();
  return (
    <button type="button" className="xbd-button xbd-button--small" onClick={() => api.openApp('contacts', { path })}>
      Yeni pencerede
    </button>
  );
}

function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = CONTACTS.find((x) => x.id === id);
  if (!c) return <p>Kişi bulunamadı.</p>;
  return (
    <div className="demo-contacts">
      <button type="button" className="xbd-button xbd-button--small" onClick={() => navigate(-1)}>
        ← Geri
      </button>
      <div className="demo-contacts__card">
        <span className="demo-contacts__avatar demo-contacts__avatar--large" aria-hidden="true">
          {c.name[0]}
        </span>
        <h2>{c.name}</h2>
        <p>
          {c.role} · {c.city}
        </p>
        <code>adres: /kisiler/{c.id}</code>
      </div>
    </div>
  );
}

export const contactRoutes = (
  <Routes>
    <Route path="/kisiler" element={<ContactList />} />
    <Route path="/kisiler/:id" element={<ContactDetail />} />
  </Routes>
);
