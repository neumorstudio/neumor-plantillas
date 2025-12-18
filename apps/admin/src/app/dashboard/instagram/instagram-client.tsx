"use client";

import { useState } from "react";

interface SocialAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string | null;
  account_image: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
}

interface ScheduledPost {
  id: string;
  content_type: string;
  caption: string | null;
  media_urls: string[] | null;
  scheduled_for: string | null;
  published_at: string | null;
  status: string;
  post_url: string | null;
  created_at: string;
}

interface Props {
  account: SocialAccount | null;
  posts: ScheduledPost[];
  oauthUrl: string;
  websiteId: string;
  isConfigured: boolean;
  webhookUrl?: string;
}

export function InstagramClient({
  account,
  posts,
  oauthUrl,
  websiteId,
  isConfigured,
  webhookUrl,
}: Props) {
  const [showNewPost, setShowNewPost] = useState(false);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!caption || !imageUrl) {
      alert("Por favor completa todos los campos");
      return;
    }

    setIsPublishing(true);

    try {
      if (!webhookUrl) {
        throw new Error("Webhook URL no configurada");
      }
      // Llamar al webhook de n8n para publicar
      const response = await fetch(
        webhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            website_id: websiteId,
            instagram_account_id: account?.account_id,
            access_token: "TOKEN_FROM_DATABASE", // En produccion, esto vendria del backend
            image_url: imageUrl,
            caption: caption,
          }),
        }
      );

      if (response.ok) {
        alert("Post publicado correctamente");
        setCaption("");
        setImageUrl("");
        setShowNewPost(false);
      } else {
        throw new Error("Error al publicar");
      }
    } catch {
      alert("Error al publicar. Verifica la configuracion.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Estado: No configurado
  if (!isConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          Configuracion pendiente
        </h2>
        <p className="text-yellow-700 mb-4">
          Para usar Instagram, tu administrador necesita configurar las
          credenciales de Meta (Facebook).
        </p>
        <div className="bg-white rounded p-4 text-sm font-mono text-gray-600">
          <p>Variables de entorno necesarias:</p>
          <ul className="mt-2 space-y-1">
            <li>META_APP_ID=tu_app_id</li>
            <li>META_APP_SECRET=tu_app_secret</li>
          </ul>
        </div>
      </div>
    );
  }

  // Estado: Sin cuenta conectada
  if (!account) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Conecta tu Instagram</h2>
          <p className="text-gray-500 mb-6">
            Vincula tu cuenta de Instagram Business para publicar contenido
            automaticamente.
          </p>
          <a
            href={oauthUrl}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
            </svg>
            Conectar Instagram
          </a>
        </div>
      </div>
    );
  }

  // Estado: Cuenta conectada
  return (
    <div className="space-y-6">
      {/* Cuenta conectada */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {account.account_image ? (
              <img
                src={account.account_image}
                alt={account.account_name || "Instagram"}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="font-semibold">
                @{account.account_name || account.account_id}
              </h3>
              <p className="text-sm text-gray-500">
                {account.is_active ? (
                  <span className="text-green-600">Conectado</span>
                ) : (
                  <span className="text-red-600">Desconectado</span>
                )}
                {account.token_expires_at && (
                  <span className="ml-2">
                    - Token expira:{" "}
                    {new Date(account.token_expires_at).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showNewPost ? "Cancelar" : "Nuevo Post"}
          </button>
        </div>
      </div>

      {/* Formulario nuevo post */}
      {showNewPost && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Crear nuevo post</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                URL de la imagen
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                La imagen debe ser accesible publicamente (JPEG)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escribe el texto del post..."
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {isPublishing ? "Publicando..." : "Publicar ahora"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de posts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Posts recientes</h3>
        </div>
        {posts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay posts todavia
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="p-4 flex items-center gap-4">
                {post.media_urls?.[0] && (
                  <img
                    src={post.media_urls[0]}
                    alt=""
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm line-clamp-2">
                    {post.caption || "Sin caption"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {post.published_at
                      ? `Publicado: ${new Date(post.published_at).toLocaleString()}`
                      : post.scheduled_for
                        ? `Programado: ${new Date(post.scheduled_for).toLocaleString()}`
                        : `Creado: ${new Date(post.created_at).toLocaleString()}`}
                  </p>
                </div>
                <div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : post.status === "scheduled"
                          ? "bg-blue-100 text-blue-700"
                          : post.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
