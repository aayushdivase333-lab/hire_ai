const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
    }

    return data;
}

// Companies API
export const companiesApi = {
    list: (params?: { page?: number; search?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.search) searchParams.set('search', params.search);
        return fetchApi(`/companies?${searchParams}`);
    },

    get: (id: string) => fetchApi(`/companies/${id}`),

    create: (data: { name: string; domain?: string; website_url?: string; notes?: string }) =>
        fetchApi('/companies', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: Partial<{ name: string; domain: string; notes: string }>) =>
        fetchApi(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: string) => fetchApi(`/companies/${id}`, { method: 'DELETE' }),

    deleteByDomain: (domain: string) =>
        fetchApi(`/companies/domain/${domain}`, { method: 'DELETE' }),
};

// People API
export const peopleApi = {
    list: (params?: { page?: number; company_id?: string; search?: string; seniority?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.company_id) searchParams.set('company_id', params.company_id);
        if (params?.search) searchParams.set('search', params.search);
        if (params?.seniority) searchParams.set('seniority', params.seniority);
        return fetchApi(`/people?${searchParams}`);
    },

    get: (id: string) => fetchApi(`/people/${id}`),

    create: (data: {
        company_id: string;
        full_name: string;
        first_name: string;
        last_name: string;
        title?: string;
        location?: string;
        linkedin_url?: string;
        source?: string;
    }) => fetchApi('/people', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: Partial<{
        full_name: string;
        first_name: string;
        last_name: string;
        title: string;
        location: string;
        linkedin_url: string;
    }>) => fetchApi(`/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: string) => fetchApi(`/people/${id}`, { method: 'DELETE' }),

    markDoNotContact: (id: string) =>
        fetchApi(`/people/${id}/do-not-contact`, { method: 'POST' }),

    generateEmails: (id: string) =>
        fetchApi(`/people/${id}/generate-emails`, { method: 'POST' }),

    validateEmails: (id: string, skipSmtp = true) =>
        fetchApi(`/people/${id}/validate-emails`, {
            method: 'POST',
            body: JSON.stringify({ skipSmtp }),
        }),

    addEmail: (id: string, email: string, confidence = 'high') =>
        fetchApi(`/people/${id}/add-email`, {
            method: 'POST',
            body: JSON.stringify({ email, confidence }),
        }),

    setPrimaryEmail: (personId: string, emailId: string) =>
        fetchApi(`/people/${personId}/emails/${emailId}/primary`, { method: 'PUT' }),
};

// Templates API
export const templatesApi = {
    list: (params?: { type?: string; offer_type?: string; active?: boolean }) => {
        const searchParams = new URLSearchParams();
        if (params?.type) searchParams.set('type', params.type);
        if (params?.offer_type) searchParams.set('offer_type', params.offer_type);
        if (params?.active !== undefined) searchParams.set('active', params.active.toString());
        return fetchApi(`/templates?${searchParams}`);
    },

    get: (id: string) => fetchApi(`/templates/${id}`),

    create: (data: {
        name: string;
        subject: string;
        body: string;
        template_type: string;
        offer_type: string;
    }) => fetchApi('/templates', { method: 'POST', body: JSON.stringify(data) }),

    update: (id: string, data: Partial<{
        name: string;
        subject: string;
        body: string;
        is_active: boolean;
    }>) => fetchApi(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id: string) => fetchApi(`/templates/${id}`, { method: 'DELETE' }),

    preview: (id: string, variables?: Record<string, string>) =>
        fetchApi(`/templates/${id}/preview`, {
            method: 'POST',
            body: JSON.stringify(variables || {}),
        }),

    duplicate: (id: string) =>
        fetchApi(`/templates/${id}/duplicate`, { method: 'POST' }),
};

// Outreach API
export const outreachApi = {
    list: (params?: { page?: number; status?: string; person_id?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.status) searchParams.set('status', params.status);
        if (params?.person_id) searchParams.set('person_id', params.person_id);
        return fetchApi(`/outreach?${searchParams}`);
    },

    get: (id: string) => fetchApi(`/outreach/${id}`),

    create: (data: {
        person_id: string;
        subject: string;
        body: string;
        template_id?: string;
        schedule_at?: string;
    }) => fetchApi('/outreach', { method: 'POST', body: JSON.stringify(data) }),

    createBulk: (data: {
        person_ids: string[];
        template_id: string;
        custom_variables?: Record<string, string>;
        schedule_at?: string;
    }) => fetchApi('/outreach/bulk', { method: 'POST', body: JSON.stringify(data) }),

    send: (id: string) => fetchApi(`/outreach/${id}/send`, { method: 'POST' }),

    cancel: (id: string) => fetchApi(`/outreach/${id}/cancel`, { method: 'POST' }),

    markReplied: (id: string) => fetchApi(`/outreach/${id}/mark-replied`, { method: 'POST' }),

    delete: (id: string) => fetchApi(`/outreach/${id}`, { method: 'DELETE' }),

    getStats: () => fetchApi('/outreach/stats'),
};

// Discovery API
export const discoveryApi = {
    getSuggestions: (companyName: string) =>
        fetchApi(`/discovery/suggestions?companyName=${encodeURIComponent(companyName)}`),

    discoverDomain: (companyName: string, website?: string) =>
        fetchApi('/discovery/company-domain', {
            method: 'POST',
            body: JSON.stringify({ companyName, website }),
        }),

    parseLinkedIn: (data: {
        linkedinUrl?: string;
        fullName: string;
        title?: string;
        location?: string;
        companyId: string;
    }) => fetchApi('/discovery/parse-linkedin', { method: 'POST', body: JSON.stringify(data) }),

    generateEmails: (firstName: string, lastName: string, domain: string) =>
        fetchApi('/discovery/generate-emails', {
            method: 'POST',
            body: JSON.stringify({ firstName, lastName, domain }),
        }),

    batchEmails: (companyId: string, personIds?: string[]) =>
        fetchApi('/discovery/batch-emails', {
            method: 'POST',
            body: JSON.stringify({ companyId, personIds }),
        }),

    autoDiscover: (companyName: string, options?: { roles?: string[]; maxResults?: number }) =>
        fetchApi('/discovery/auto', {
            method: 'POST',
            body: JSON.stringify({ companyName, ...options }),
        }),
};

// System API
export const systemApi = {
    health: () => fetchApi('/health'),
    stats: () => fetchApi('/stats'),
    settings: () => fetchApi('/settings'),
    audit: (page = 1) => fetchApi(`/audit?page=${page}`),
    unsubscribe: (token: string, email: string) =>
        fetchApi(`/unsubscribe/${token}`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
    cleanup: (days?: number) =>
        fetchApi(`/data/cleanup${days ? `?days=${days}` : ''}`, { method: 'DELETE' }),
    deleteAll: () =>
        fetchApi('/data/delete-all?confirm=yes-delete-everything', { method: 'DELETE' }),
};

export default {
    companies: companiesApi,
    people: peopleApi,
    templates: templatesApi,
    outreach: outreachApi,
    discovery: discoveryApi,
    system: systemApi,
};
