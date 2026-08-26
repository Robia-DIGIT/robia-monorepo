"use client";

import { Shield, Users, FileText, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const pmes = [
    { id: "pme-1", name: "Maison Martin Boulangerie", website: "maisonmartin.fr", score: 68, status: "active", lastAudit: "12 Juillet 2026" },
    { id: "pme-2", name: "Garage Du Centre", website: "garage-du-centre.fr", score: 82, status: "active", lastAudit: "10 Juillet 2026" },
    { id: "pme-3", name: "Cabinet Dentaire Paris 5", website: "dentiste-paris5.fr", score: 45, status: "pending", lastAudit: "28 Juin 2026" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Dashboard Administrateur ROBIA
        </h1>
        <p className="text-xs text-light-slate">
          Portail d'administration pour superviser les entreprises clientes, les rapports d&apos;audits et les demandes de validation en attente.
        </p>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-light-slate block uppercase font-medium">PMEs Actives</span>
            <span className="text-2xl font-black text-navy">{pmes.length}</span>
          </div>
          <Users className="h-8 w-8 text-primary/30" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-light-slate block uppercase font-medium">Moyenne des Scores</span>
            <span className="text-2xl font-black text-navy">65 / 100</span>
          </div>
          <CheckCircle className="h-8 w-8 text-primary/30" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-light-slate block uppercase font-medium">Validations En Attente</span>
            <span className="text-2xl font-black text-accent">5 documents</span>
          </div>
          <FileText className="h-8 w-8 text-accent/30" />
        </div>
      </div>

      {/* Clients management table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-4">
        <h3 className="text-sm font-bold text-navy">Liste des entreprises clientes</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-secondary/40 text-navy font-bold border-b border-gray-150">
                <th className="p-3">Entreprise</th>
                <th className="p-3">Site internet</th>
                <th className="p-3 text-center">Score SEO</th>
                <th className="p-3">Dernier Audit</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-dark-slate">
              {pmes.map((pme) => (
                <tr key={pme.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-bold">{pme.name}</td>
                  <td className="p-3 font-mono text-primary hover:underline">
                    <a href={`https://${pme.website}`} target="_blank" rel="noreferrer noopener">
                      {pme.website}-
                    </a>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                      pme.score >= 70 ? "bg-green-50 text-green-600" : pme.score >= 50 ? "bg-orange-50 text-accent" : "bg-red-50 text-red-650"
                    }`}>
                      {pme.score}%
                    </span>
                  </td>
                  <td className="p-3">{pme.lastAudit}</td>
                  <td className="p-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      pme.status === "active" ? "bg-primary/10 text-primary" : "bg-gray-100 text-light-slate"
                    }`}>
                      {pme.status === "active" ? "Actif" : "En attente"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-navy hover:text-primary transition-colors cursor-pointer"
                    >
                      Superviser
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
