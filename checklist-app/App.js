import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@checklist_tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    } catch (e) {
      Alert.alert('Klaida', 'Nepavyko įkelti užduočių.');
    }
  };

  const saveTasks = async (updatedTasks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    } catch (e) {
      Alert.alert('Klaida', 'Nepavyko išsaugoti užduočių.');
    }
  };

  const addTask = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newTask = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setInputText('');
  };

  const toggleTask = (id) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updated);
    saveTasks(updated);
  };

  const deleteTask = (id) => {
    Alert.alert('Ištrinti užduotį', 'Ar tikrai norite ištrinti šią užduotį?', [
      { text: 'Atšaukti', style: 'cancel' },
      {
        text: 'Ištrinti',
        style: 'destructive',
        onPress: () => {
          const updated = tasks.filter((task) => task.id !== id);
          setTasks(updated);
          saveTasks(updated);
        },
      },
    ]);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  const renderTask = ({ item }) => (
    <View style={styles.taskRow}>
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => toggleTask(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, item.completed && styles.checkboxDone]}>
          {item.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.taskText, item.completed && styles.taskTextDone]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTask(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mano sąrašas</Text>
          {tasks.length > 0 && (
            <Text style={styles.subtitle}>
              {completedCount} / {tasks.length} atlikta
            </Text>
          )}
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Nėra užduočių.</Text>
              <Text style={styles.emptyHint}>Pridėkite pirmą užduotį!</Text>
            </View>
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Nauja užduotis..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, !inputText.trim() && styles.addButtonDisabled]}
            onPress={addTask}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PURPLE = '#6C63FF';
const LIGHT_PURPLE = '#EAE9FF';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PURPLE,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PURPLE,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  taskText: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    flexWrap: 'wrap',
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },
  emptyHint: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#222',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  addButtonDisabled: {
    backgroundColor: '#C5C2F5',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
  },
});
