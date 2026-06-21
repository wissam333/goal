<template>
  <div>
    <SharedUiHeaderPage
      title="المستخدمون"
      subtitle="قائمة المستخدمين المسجلين ونقاط توقعاتهم"
      icon="mdi:account-group-outline"
      :is-rtl="true"
    />

    <div v-if="loading" class="loading">جاري التحميل...</div>

    <div v-else-if="!users.length" class="empty">لا يوجد مستخدمين بعد</div>

    <div v-else class="table-wrap">
      <table class="users-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الدور</th>
            <th>النقاط</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="name-cell">
              <span class="user-avatar-sm">{{
                u.display_name?.charAt(0) || "?"
              }}</span>
              <span>{{ u.display_name || "—" }}</span>
            </td>
            <td>
              <span
                class="role-badge"
                :class="u.role === 'admin' ? 'admin' : 'user'"
              >
                {{ u.role === "admin" ? "مسؤول" : "مستخدم" }}
              </span>
            </td>
            <td class="points-cell">{{ u.prediction_points || 0 }}</td>
            <td class="date-cell">{{ formatDate(u.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: "admin" });
const supabase = useSupabase();

const users = ref([]);
const loading = ref(true);

onMounted(async () => {
  if (!supabase) {
    loading.value = false;
    return;
  }
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  users.value = profiles || [];
  loading.value = false;
});

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  const months = ["يناير","فبراير","مارس","إبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
</script>

<style lang="scss" scoped>
.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.table-wrap {
  overflow-x: auto;
  background: var(--bg-surface);
  border-radius: 14px;
  border: 1px solid var(--border-color);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    text-align: start;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-color);
    white-space: nowrap;
  }

  td {
    padding: 12px 16px;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.points-cell {
  font-weight: 700;
  color: var(--primary);
}

.date-cell {
  color: var(--text-muted);
  font-size: 0.78rem;
  white-space: nowrap;
}

.role-badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  &.admin {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  &.user {
    background: var(--primary-soft);
    color: var(--primary);
  }
}
</style>
