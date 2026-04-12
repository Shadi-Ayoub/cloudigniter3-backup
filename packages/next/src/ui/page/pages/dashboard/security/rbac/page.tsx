'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@CI/ui/components/shadcn/tabs';
import { Button } from '@CI/ui/components/shadcn/button';
import { Card, CardHeader, CardTitle, CardContent } from '@CI/ui/components/shadcn/card';
import { ScrollArea } from '@CI/ui/components/shadcn/scroll-area';
import { Badge } from '@CI/ui/components/shadcn/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@CI/ui/components/shadcn/dialog';
import { Input } from '@CI/ui/components/shadcn/input';
import { Textarea } from '@CI/ui/components/shadcn/textarea';
import { Checkbox } from '@CI/ui/components/shadcn/checkbox';

// You would replace these with actual API calls to Amplify functions.
async function apiListRoles() {
  /* ... */
}
async function apiListPermissions() {
  /* ... */
}
async function apiUpsertRole(payload: any) {
  /* ... */
}
async function apiUpsertPermission(payload: any) {
  /* ... */
}

export function RbacPage() {
  const [tab, setTab] = React.useState<'roles' | 'permissions'>('roles');

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Roles &amp; Permissions</h1>
          <p className='text-muted-foreground text-sm'>
            Manage system roles, their permissions, and the underlying RBAC policy.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className='space-y-4'>
        <TabsList>
          <TabsTrigger value='roles'>Roles</TabsTrigger>
          <TabsTrigger value='permissions'>Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value='roles'>
          <RolesTab />
        </TabsContent>

        <TabsContent value='permissions'>
          <PermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------- ROLES TAB ----------------

type Permission = {
  scope: string;
  resource: string;
  action: string;
  name?: string;
  description?: string;
};

type Role = {
  roleId: string;
  name: string;
  description?: string;
  tenantId?: string;
  permissions: string[]; // list of scopes
};

function RolesTab() {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [rolesRes, permsRes] = await Promise.all([apiListRoles(), apiListPermissions()]);
        setRoles(rolesRes.roles);
        setPermissions(permsRes.permissions);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleNewRole = () => {
    setEditingRole({
      roleId: '',
      name: '',
      description: '',
      permissions: [],
    });
    setDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleSaveRole = async (role: Role) => {
    await apiUpsertRole(role);
    // Refresh
    const rolesRes = await apiListRoles();
    setRoles(rolesRes.roles);
    setDialogOpen(false);
  };

  return (
    <div className='grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'>
      <Card className='flex flex-col'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <CardTitle className='text-base font-medium'>Roles</CardTitle>
          <Button size='sm' onClick={handleNewRole}>
            <Plus className='mr-2 h-4 w-4' /> New role
          </Button>
        </CardHeader>
        <CardContent className='flex-1'>
          <ScrollArea className='h-[420px]'>
            <div className='space-y-2'>
              {roles.map((role) => (
                <button
                  key={role.roleId}
                  type='button'
                  onClick={() => handleEditRole(role)}
                  className='hover:bg-muted/60 w-full rounded-md border px-3 py-2 text-left transition'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <div>
                      <div className='font-medium'>{role.name}</div>
                      <div className='text-muted-foreground text-xs'>ID: {role.roleId}</div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline'>{role.permissions.length} perms</Badge>
                      {role.tenantId && (
                        <Badge variant='secondary' className='text-xs'>
                          {role.tenantId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {role.description && (
                    <p className='text-muted-foreground mt-1 line-clamp-1 text-xs'>{role.description}</p>
                  )}
                </button>
              ))}

              {!roles.length && !loading && <p className='text-muted-foreground text-sm'>No roles defined yet.</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-base font-medium'>{editingRole ? `Edit role` : `Role details`}</CardTitle>
        </CardHeader>
        <CardContent>
          {!editingRole && (
            <p className='text-muted-foreground text-sm'>
              Select a role from the list or create a new one to manage its permissions.
            </p>
          )}

          {editingRole && (
            <RoleEditor
              role={editingRole}
              permissions={permissions}
              onChange={setEditingRole}
              onSave={handleSaveRole}
            />
          )}
        </CardContent>
      </Card>

      {/* Optional: use Dialog instead of side panel */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{editingRole?.roleId ? 'Edit role' : 'Create role'}</DialogTitle>
          </DialogHeader>
          {editingRole && (
            <RoleEditor
              role={editingRole}
              permissions={permissions}
              onChange={setEditingRole}
              onSave={handleSaveRole}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RoleEditorProps {
  role: Role;
  permissions: Permission[];
  onChange(role: Role): void;
  onSave(role: Role): Promise<void>;
}

function RoleEditor({ role, permissions, onChange, onSave }: RoleEditorProps) {
  const [saving, setSaving] = React.useState(false);

  const toggleScope = (scope: string) => {
    const exists = role.permissions.includes(scope);
    const next = exists ? role.permissions.filter((s) => s !== scope) : [...role.permissions, scope];
    onChange({ ...role, permissions: next });
  };

  const grouped = React.useMemo(() => {
    const byResource: Record<string, Permission[]> = {};
    for (const p of permissions) {
      const key = p.resource || 'general';
      if (!byResource[key]) byResource[key] = [];
      byResource[key].push(p);
    }
    return byResource;
  }, [permissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(role);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-2'>
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>
            Role ID <span className='text-red-500'>*</span>
          </label>
          <Input
            value={role.roleId}
            onChange={(e) => onChange({ ...role, roleId: e.target.value.trim() })}
            placeholder='admin, teacher, counselor...'
            disabled={!!role.roleId} // prevent changing ID on edit
          />
          <p className='text-muted-foreground text-xs'>Used as a stable key and to derive the Cognito group name.</p>
        </div>
        <div className='space-y-1.5'>
          <label className='text-sm font-medium'>
            Display name <span className='text-red-500'>*</span>
          </label>
          <Input
            value={role.name}
            onChange={(e) => onChange({ ...role, name: e.target.value })}
            placeholder='System Administrator'
          />
        </div>
      </div>

      <div className='space-y-1.5'>
        <label className='text-sm font-medium'>Description</label>
        <Textarea value={role.description ?? ''} onChange={(e) => onChange({ ...role, description: e.target.value })} />
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-medium'>Permissions</h3>
          <Badge variant='outline'>{role.permissions.length} selected</Badge>
        </div>
        <ScrollArea className='h-56 rounded-md border p-2'>
          <div className='space-y-3'>
            {Object.entries(grouped).map(([resource, perms]) => (
              <div key={resource} className='space-y-1'>
                <div className='text-muted-foreground text-xs font-semibold uppercase'>{resource}</div>
                <div className='space-y-1'>
                  {perms.map((p) => {
                    const checked = role.permissions.includes(p.scope);
                    return (
                      <label
                        key={p.scope}
                        className='hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1'
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleScope(p.scope)} />
                        <div className='min-w-0'>
                          <div className='text-xs font-medium'>{p.scope}</div>
                          {p.description && <div className='text-muted-foreground text-[11px]'>{p.description}</div>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className='flex justify-end gap-2'>
        <Button type='submit' disabled={saving || !role.roleId || !role.name}>
          {saving ? 'Saving...' : 'Save role'}
        </Button>
      </div>
    </form>
  );
}

// ---------------- PERMISSIONS TAB ----------------

function PermissionsTab() {
  // Very similar structure: table + dialog using apiListPermissions/apiUpsertPermission.
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-base font-medium'>Permissions catalog</CardTitle>
        <Button size='sm'>
          <Plus className='mr-2 h-4 w-4' /> New permission
        </Button>
      </CardHeader>
      <CardContent>
        {/* Replace with your DataTable or a list similar to roles */}
        <p className='text-muted-foreground text-sm'>
          Configure canonical permissions (scopes) here. Roles will reference these scopes.
        </p>
      </CardContent>
    </Card>
  );
}
