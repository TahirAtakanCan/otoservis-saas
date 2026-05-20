// apps/mobile/src/app/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { getVehiclesByTenant, getActiveServicesByTenant, updateServiceStatus } from '../../lib/api';
import { logoutUser } from '../../lib/auth';
import { ServiceRecord, Vehicle } from '@repo/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, tenant } = useAuthStore();
  const brandColor = tenant?.primaryColor || '#3b82f6'; // Dinamik marka rengi

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const vData = await getVehiclesByTenant(user.tenantId);
      const sData = await getActiveServicesByTenant(user.tenantId);
      setVehicles(vData);
      setServices(sData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStatusUpdate = async (recordId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'bekliyor' ? 'islemde' : 'tamamlandi';
    try {
      await updateServiceStatus(recordId, newStatus as ServiceRecord['status']);
      fetchData(); // Listeyi yenile
    } catch (error) {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/'); // Çıkış yapınca giriş ekranına dön
  };

  // Araç plakasını bulmak için yardımcı fonksiyon
  const getVehicleInfo = (vehicleId: string) => {
    const v = vehicles.find(v => v.id === vehicleId);
    return v ? `${v.plate} - ${v.brand} ${v.model}` : 'Bilinmeyen Araç';
  };

  const renderServiceItem = ({ item }: { item: ServiceRecord }) => {
    const isWaiting = item.status === 'bekliyor';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.plateText}>{getVehicleInfo(item.vehicleId)}</Text>
          <View style={[styles.badge, { backgroundColor: isWaiting ? '#fef3c7' : '#dbeafe' }]}>
            <Text style={{ color: isWaiting ? '#d97706' : '#2563eb', fontWeight: 'bold', fontSize: 12 }}>
              {isWaiting ? '⏳ Bekliyor' : '🔧 İşlemde'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.description}>{item.description}</Text>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isWaiting ? brandColor : '#10b981' }]}
          onPress={() => handleStatusUpdate(item.id, item.status)}
        >
          <Text style={styles.actionButtonText}>
            {isWaiting ? 'İşleme Başla' : 'İşi Tamamla'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ÜST BİLGİ ALANI (HEADER) */}
      <View style={[styles.header, { backgroundColor: brandColor }]}>
        <View>
          <Text style={styles.headerTitle}>{tenant?.name || 'OtoServis'}</Text>
          <Text style={styles.headerSubtitle}>Hoş geldin, {user?.fullName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* İŞ EMİRLERİ LİSTESİ */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={brandColor} />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>Şu an bekleyen veya işlemde olan bir araç yok. Harika!</Text>
          <TouchableOpacity onPress={fetchData} style={{ marginTop: 10 }}>
            <Text style={{ color: brandColor, fontWeight: 'bold' }}>Listeyi Yenile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderServiceItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshing={isLoading}
          onRefresh={fetchData}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  logoutButton: { backgroundColor: 'rgba(0,0,0,0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { textAlign: 'center', color: '#6b7280', fontSize: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  plateText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  description: { fontSize: 14, color: '#4b5563', backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 12 },
  actionButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});