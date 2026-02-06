"use client";

import { useEffect, useState } from "react";

interface Template {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  is_active: boolean;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipients_count: number;
  opened_count: number;
  sent_at: string | null;
  created_at: string;
}

interface Automation {
  id: string;
  is_enabled: boolean;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  day_of_week: number;
  day_of_month: number;
  send_time: string;
  timezone: string;
  auto_audience: string;
  default_template_id: string | null;
  next_scheduled_at: string | null;
  last_sent_at: string | null;
  total_campaigns_sent: number;
}

interface Props {
  websiteId: string;
  initialTemplates: Template[];
  initialCampaigns: Campaign[];
  subscriberCount: number;
  initialAutomation?: Automation | null;
}

type Tab = "templates" | "campaigns" | "editor" | "automation";

const defaultEmailTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #2c3e50;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">{{restaurantName}}</h1>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin: 0 0 20px;">{{title}}</h2>
        <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">
          {{content}}
        </p>

        <!-- CTA Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 30px auto;">
          <tr>
            <td style="background-color: #e74c3c; border-radius: 8px;">
              <a href="{{ctaLink}}" style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; font-weight: bold;">
                {{ctaText}}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 30px; text-align: center; background-color: #f8f8f8; border-top: 1px solid #eeeeee;">
        <p style="color: #999999; font-size: 12px; margin: 0 0 10px;">
          {{address}}
        </p>
        <p style="color: #999999; font-size: 12px; margin: 0;">
          <a href="{{unsubscribeLink}}" style="color: #999999;">Darse de baja</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

const defaultAutomation: Automation = {
  id: "",
  is_enabled: false,
  frequency: "weekly",
  day_of_week: 1,
  day_of_month: 1,
  send_time: "10:00",
  timezone: "Europe/Madrid",
  auto_audience: "all",
  default_template_id: null,
  next_scheduled_at: null,
  last_sent_at: null,
  total_campaigns_sent: 0,
};

export function NewsletterClient({
  websiteId,
  initialTemplates,
  initialCampaigns,
  subscriberCount,
  initialAutomation,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [templates, setTemplates] = useState(initialTemplates);
  const [campaigns] = useState(initialCampaigns);
  const [automation, setAutomation] = useState<Automation>(initialAutomation || defaultAutomation);
  const [savingAutomation, setSavingAutomation] = useState(false);

  // Editor state
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    preview_text: "",
    html_content: defaultEmailTemplate,
  });

  // Campaign state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    audience: "all_customers",
  });

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  // AI Generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  // Template CRUD
  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.html_content) {
      setMessage({ type: "error", text: "Completa todos los campos requeridos" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/templates", {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate?.id,
          websiteId,
          ...templateForm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: editingTemplate ? "Plantilla actualizada" : "Plantilla creada" });

        if (editingTemplate) {
          setTemplates(templates.map(t => t.id === data.template.id ? data.template : t));
        } else {
          setTemplates([data.template, ...templates]);
        }

        // Reset form
        setTemplateForm({
          name: "",
          subject: "",
          preview_text: "",
          html_content: defaultEmailTemplate,
        });
        setEditingTemplate(null);
        setEditorMode("create");
        setActiveTab("templates");
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      preview_text: template.preview_text || "",
      html_content: template.html_content,
    });
    setEditorMode("edit");
    setActiveTab("editor");
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Estas seguro de eliminar esta plantilla?")) return;

    try {
      const response = await fetch(`/api/newsletter/templates?id=${templateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId));
        setMessage({ type: "success", text: "Plantilla eliminada" });
      }
    } catch {
      setMessage({ type: "error", text: "Error al eliminar" });
    }
  };

  // Send Campaign
  const handleSendCampaign = async () => {
    if (!selectedTemplate || !campaignForm.name) {
      setMessage({ type: "error", text: "Completa todos los campos" });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          templateId: selectedTemplate.id,
          name: campaignForm.name,
          audience: campaignForm.audience,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `Campana enviada a ${data.recipientCount} suscriptores` });
        setShowCampaignModal(false);
        setCampaignForm({ name: "", audience: "all_customers" });
        setSelectedTemplate(null);
      } else {
        setMessage({ type: "error", text: data.error || "Error al enviar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSending(false);
    }
  };

  // Save Automation
  const handleSaveAutomation = async () => {
    setSavingAutomation(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          ...automation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAutomation(data.automation);
        setMessage({ type: "success", text: automation.is_enabled ? "Automatizacion activada" : "Configuracion guardada" });
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSavingAutomation(false);
    }
  };

  // Generate with AI
  const handleGenerateWithAI = async () => {
    if (!aiPrompt || aiPrompt.trim().length < 10) {
      setMessage({ type: "error", text: "Describe qué tipo de email quieres (mínimo 10 caracteres)" });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          websiteId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTemplateForm({
          ...templateForm,
          html_content: data.html,
          subject: data.suggestedSubject || templateForm.subject,
          name: templateForm.name || data.suggestedName || "",
        });
        setShowAIModal(false);
        setAiPrompt("");
        setMessage({ type: "success", text: "Plantilla generada con IA. Revisa y personaliza el contenido." });
      } else {
        setMessage({ type: "error", text: data.error || "Error al generar plantilla" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setGenerating(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    return days[day];
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: "Diariamente",
      weekly: "Semanalmente",
      biweekly: "Cada 2 semanas",
      monthly: "Mensualmente",
    };
    return labels[freq] || freq;
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all: "Todos los suscriptores",
      recent_30d: "Clientes ultimos 30 dias",
      recent_60d: "Clientes ultimos 60 dias",
      inactive_30d: "Clientes inactivos (+30 dias)",
    };
    return labels[audience] || audience;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      scheduled: "bg-blue-100 text-blue-700",
      sending: "bg-yellow-100 text-yellow-700",
      sent: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      draft: "Borrador",
      scheduled: "Programada",
      sending: "Enviando",
      sent: "Enviada",
      failed: "Fallida",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Newsletter</h1>
        <p className="text-[var(--text-secondary)]">
          Envia emails a tus clientes para mantenerlos informados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="neumor-card p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-[var(--accent)]">{subscriberCount}</p>
          <p className="text-sm text-[var(--text-secondary)]">Suscriptores</p>
        </div>
        <div className="neumor-card p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold">{templates.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Plantillas</p>
        </div>
        <div className="neumor-card p-4 text-center">
          <p className="text-2xl sm:text-3xl font-bold">{campaigns.length}</p>
          <p className="text-sm text-[var(--text-secondary)]">Campañas</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100%-2rem))]">
          <div
            className={`p-4 rounded-xl text-sm font-medium shadow-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap sm:flex-nowrap overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
            activeTab === "templates"
              ? "bg-[var(--accent)] text-white"
              : "neumor-btn"
          }`}
        >
          Plantillas
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
            activeTab === "campaigns"
              ? "bg-[var(--accent)] text-white"
              : "neumor-btn"
          }`}
        >
          Campañas
        </button>
        <button
          onClick={() => {
            setActiveTab("editor");
            setEditorMode("create");
            setEditingTemplate(null);
            setTemplateForm({
              name: "",
              subject: "",
              preview_text: "",
              html_content: defaultEmailTemplate,
            });
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
            activeTab === "editor"
              ? "bg-[var(--accent)] text-white"
              : "neumor-btn"
          }`}
        >
          + Nueva Plantilla
        </button>
        <button
          onClick={() => setActiveTab("automation")}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm sm:text-base whitespace-nowrap ${
            activeTab === "automation"
              ? "bg-[var(--accent)] text-white"
              : "neumor-btn"
          }`}
        >
          <span>Automatizacion</span>
          {automation.is_enabled && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <div className="neumor-card p-8 text-center">
              <p className="text-[var(--text-secondary)] mb-4">No tienes plantillas creadas</p>
              <button
                onClick={() => setActiveTab("editor")}
                className="neumor-btn neumor-btn-accent"
              >
                Crear primera plantilla
              </button>
            </div>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="neumor-card p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Asunto: {template.subject}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Creada: {new Date(template.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowCampaignModal(true);
                      }}
                      className="neumor-btn neumor-btn-accent text-sm px-3 py-1 w-full sm:w-auto"
                    >
                      Enviar
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="neumor-btn text-sm px-3 py-1 w-full sm:w-auto"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="neumor-btn text-sm px-3 py-1 text-red-600 w-full sm:w-auto"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="neumor-card p-8 text-center">
              <p className="text-[var(--text-secondary)]">No has enviado ninguna campana</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="neumor-card p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {campaign.subject}
                    </p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="text-[var(--text-secondary)]">
                      {campaign.recipients_count} enviados
                    </p>
                    <p className="text-[var(--text-secondary)]">
                      {campaign.opened_count} abiertos
                    </p>
                    {campaign.sent_at && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {new Date(campaign.sent_at).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Editor Tab */}
      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div className="neumor-card p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <h3 className="font-semibold">
                  {editorMode === "edit" ? "Editar Plantilla" : "Nueva Plantilla"}
                </h3>
                <button
                  onClick={() => setShowAIModal(true)}
                  className="neumor-btn w-full sm:w-auto flex items-center justify-center gap-2 text-sm px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Generar con IA
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre interno</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Ej: Promocion Navidad"
                    className="neumor-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Asunto del email</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="Ej: Descubre nuestro nuevo menu!"
                    className="neumor-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Texto de preview</label>
                  <input
                    type="text"
                    value={templateForm.preview_text}
                    onChange={(e) => setTemplateForm({ ...templateForm, preview_text: e.target.value })}
                    placeholder="Texto que aparece en la bandeja de entrada"
                    className="neumor-input w-full"
                  />
                </div>

                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="neumor-btn neumor-btn-accent w-full"
                >
                  {saving ? "Guardando..." : editorMode === "edit" ? "Actualizar Plantilla" : "Guardar Plantilla"}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="neumor-card p-4">
            <h3 className="font-semibold mb-4">Vista Previa</h3>
            <div className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-[420px] sm:max-h-[600px]">
              <iframe
                srcDoc={templateForm.html_content
                  .replace(/\{\{restaurantName\}\}/g, "Tu Restaurante")
                  .replace(/\{\{title\}\}/g, "Titulo del Email")
                  .replace(/\{\{content\}\}/g, "Este es el contenido de tu email. Puedes personalizarlo con informacion sobre promociones, eventos especiales o novedades de tu restaurante.")
                  .replace(/\{\{ctaText\}\}/g, "Reservar Ahora")
                  .replace(/\{\{ctaLink\}\}/g, "#")
                  .replace(/\{\{address\}\}/g, "Tu direccion")
                  .replace(/\{\{unsubscribeLink\}\}/g, "#")
                  .replace(/\{\{subject\}\}/g, templateForm.subject || "Asunto")}
                className="w-full h-[500px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === "automation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config Panel */}
          <div className="space-y-6">
            {/* Toggle Principal */}
            <div className="neumor-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Envio Automatico</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Programa el envio automatico de newsletters
                  </p>
                </div>
                <button
                  onClick={() => setAutomation({ ...automation, is_enabled: !automation.is_enabled })}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    automation.is_enabled ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      automation.is_enabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {automation.is_enabled && automation.next_scheduled_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    Proximo envio: {new Date(automation.next_scheduled_at).toLocaleString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Frecuencia */}
            <div className="neumor-card p-6">
              <h3 className="font-semibold mb-4">Frecuencia de Envio</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cada cuanto enviar</label>
                  <select
                    value={automation.frequency}
                    onChange={(e) => setAutomation({ ...automation, frequency: e.target.value as Automation["frequency"] })}
                    className="neumor-input w-full"
                  >
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="biweekly">Cada 2 semanas</option>
                    <option value="monthly">Mensualmente</option>
                  </select>
                </div>

                {(automation.frequency === "weekly" || automation.frequency === "biweekly") && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Dia de la semana</label>
                    <select
                      value={automation.day_of_week}
                      onChange={(e) => setAutomation({ ...automation, day_of_week: parseInt(e.target.value) })}
                      className="neumor-input w-full"
                    >
                      <option value={1}>Lunes</option>
                      <option value={2}>Martes</option>
                      <option value={3}>Miercoles</option>
                      <option value={4}>Jueves</option>
                      <option value={5}>Viernes</option>
                      <option value={6}>Sabado</option>
                      <option value={0}>Domingo</option>
                    </select>
                  </div>
                )}

                {automation.frequency === "monthly" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Dia del mes</label>
                    <select
                      value={automation.day_of_month}
                      onChange={(e) => setAutomation({ ...automation, day_of_month: parseInt(e.target.value) })}
                      className="neumor-input w-full"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          Dia {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Hora de envio</label>
                  <input
                    type="time"
                    value={automation.send_time}
                    onChange={(e) => setAutomation({ ...automation, send_time: e.target.value })}
                    className="neumor-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Zona horaria</label>
                  <select
                    value={automation.timezone}
                    onChange={(e) => setAutomation({ ...automation, timezone: e.target.value })}
                    className="neumor-input w-full"
                  >
                    <option value="Europe/Madrid">Espana (Madrid)</option>
                    <option value="America/Mexico_City">Mexico (Ciudad de Mexico)</option>
                    <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires)</option>
                    <option value="America/Bogota">Colombia (Bogota)</option>
                    <option value="America/Lima">Peru (Lima)</option>
                    <option value="America/Santiago">Chile (Santiago)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audiencia y Plantilla */}
            <div className="neumor-card p-6">
              <h3 className="font-semibold mb-4">Configuracion de Contenido</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Audiencia automatica</label>
                  <select
                    value={automation.auto_audience}
                    onChange={(e) => setAutomation({ ...automation, auto_audience: e.target.value })}
                    className="neumor-input w-full"
                  >
                    <option value="all">Todos los suscriptores</option>
                    <option value="recent_30d">Clientes ultimos 30 dias</option>
                    <option value="recent_60d">Clientes ultimos 60 dias</option>
                    <option value="inactive_30d">Clientes inactivos (+30 dias sin reserva)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Plantilla por defecto</label>
                  <select
                    value={automation.default_template_id || ""}
                    onChange={(e) => setAutomation({ ...automation, default_template_id: e.target.value || null })}
                    className="neumor-input w-full"
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Crea una plantilla primero para poder automatizar
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Guardar */}
            <button
              onClick={handleSaveAutomation}
              disabled={savingAutomation || (automation.is_enabled && !automation.default_template_id)}
              className="neumor-btn neumor-btn-accent w-full py-3"
            >
              {savingAutomation ? "Guardando..." : "Guardar Configuracion"}
            </button>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Resumen */}
            <div className="neumor-card p-6">
              <h3 className="font-semibold mb-4">Resumen de Automatizacion</h3>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Estado</span>
                  <span className={`font-medium ${automation.is_enabled ? "text-green-600" : "text-gray-500"}`}>
                    {automation.is_enabled ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Frecuencia</span>
                  <span className="font-medium">{getFrequencyLabel(automation.frequency)}</span>
                </div>
                {automation.frequency === "weekly" || automation.frequency === "biweekly" ? (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Dia</span>
                    <span className="font-medium">{getDayName(automation.day_of_week)}</span>
                  </div>
                ) : automation.frequency === "monthly" ? (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)]">Dia del mes</span>
                    <span className="font-medium">{automation.day_of_month}</span>
                  </div>
                ) : null}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Hora</span>
                  <span className="font-medium">{automation.send_time}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Audiencia</span>
                  <span className="font-medium">{getAudienceLabel(automation.auto_audience)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2">
                  <span className="text-[var(--text-secondary)]">Campanyas enviadas</span>
                  <span className="font-medium">{automation.total_campaigns_sent}</span>
                </div>
              </div>
            </div>

            {/* Historial */}
            <div className="neumor-card p-6">
              <h3 className="font-semibold mb-4">Historial</h3>

              {automation.last_sent_at ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-[var(--text-secondary)]">Ultimo envio: </span>
                    <span className="font-medium">
                      {new Date(automation.last_sent_at).toLocaleString("es-ES")}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Aun no se ha enviado ninguna campana automatica
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="neumor-card p-6 bg-blue-50/50">
              <h3 className="font-semibold mb-3">Consejos</h3>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li>• Los martes y jueves suelen tener mejor tasa de apertura</li>
                <li>• Las 10:00-11:00 son las mejores horas para enviar</li>
                <li>• Evita enviar mas de una vez por semana</li>
                <li>• Mantén el contenido relevante y personalizado</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="neumor-card p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Enviar Campana</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plantilla</label>
                <p className="neumor-inset p-2 rounded">{selectedTemplate.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la campana</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Ej: Navidad 2024"
                  className="neumor-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Audiencia</label>
                <select
                  value={campaignForm.audience}
                  onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                  className="neumor-input w-full"
                >
                  <option value="all_customers">Todos los clientes ({subscriberCount})</option>
                  <option value="recent_customers">Clientes recientes (ultimo mes)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowCampaignModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="neumor-btn flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="neumor-btn neumor-btn-accent flex-1"
                >
                  {sending ? "Enviando..." : "Enviar Ahora"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="neumor-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Generar Plantilla con IA</h3>
                <p className="text-sm text-[var(--text-secondary)]">Describe el email que quieres crear</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Describe tu email</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Un email promocional para el menu de San Valentin con descuento del 20% en cenas romanticas. Estilo elegante con colores rojos y rosas."
                  rows={4}
                  className="neumor-input w-full"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Cuanto mas detallada sea tu descripcion, mejor sera el resultado
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800 font-medium mb-1">Ejemplos de prompts:</p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Email de bienvenida para nuevos suscriptores</li>
                  <li>• Promocion de verano con 15% de descuento</li>
                  <li>• Anuncio de nuevo menu especial de temporada</li>
                  <li>• Recordatorio de reserva para eventos especiales</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiPrompt("");
                  }}
                  className="neumor-btn flex-1"
                  disabled={generating}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={generating || aiPrompt.trim().length < 10}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      Generar Plantilla
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
