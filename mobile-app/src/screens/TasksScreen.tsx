import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { i18n } from '../utils/i18n';
import { formatDateTime } from '../utils/helpers';
import { useConnectionStore } from '../store/connectionStore';

// Components
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';

// Task types
type TaskType = 'cutting' | 'loading' | 'transport' | 'custom';

// Task status
type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed';

// Task interface
interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  scheduledTime: number;
  estimatedDuration: number; // minutes
  description: string;
  fieldId?: string;
  fieldName?: string;
}

/**
 * Tasks screen component
 * Allows scheduling and managing autonomous operations
 */
const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Morning Fodder Cutting',
      type: 'cutting',
      status: 'scheduled',
      scheduledTime: Date.now() + 3600000, // 1 hour from now
      estimatedDuration: 60,
      description: 'Cut fodder in the north field',
      fieldId: 'field-001',
      fieldName: 'North Field'
    },
    {
      id: '2',
      name: 'Transport to Storage',
      type: 'transport',
      status: 'scheduled',
      scheduledTime: Date.now() + 7200000, // 2 hours from now
      estimatedDuration: 30,
      description: 'Transport cut fodder to main storage',
      fieldId: 'field-001',
      fieldName: 'North Field'
    }
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: '',
    type: 'cutting',
    scheduledTime: Date.now() + 3600000, // 1 hour from now
    estimatedDuration: 60,
    description: '',
    fieldName: 'North Field'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { 
    isConnected, 
    connectionType, 
    connectionQuality 
  } = useConnectionStore();

  /**
   * Get task icon based on type
   */
  const getTaskIcon = (type: TaskType): string => {
    switch (type) {
      case 'cutting':
        return 'cut-outline';
      case 'loading':
        return 'archive-outline';
      case 'transport':
        return 'car-outline';
      case 'custom':
      default:
        return 'construct-outline';
    }
  };

  /**
   * Get task status color
   */
  const getTaskStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'scheduled':
        return '#2196F3';
      case 'in_progress':
        return '#FF9800';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#9E9E9E';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  /**
   * Handle create task button press
   */
  const handleCreateTask = () => {
    if (!newTask.name) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      name: newTask.name || '',
      type: newTask.type as TaskType || 'custom',
      status: 'scheduled',
      scheduledTime: newTask.scheduledTime || Date.now(),
      estimatedDuration: newTask.estimatedDuration || 60,
      description: newTask.description || '',
      fieldName: newTask.fieldName
    };

    setTasks([...tasks, task]);
    setModalVisible(false);
    
    // Reset new task form
    setNewTask({
      name: '',
      type: 'cutting',
      scheduledTime: Date.now() + 3600000,
      estimatedDuration: 60,
      description: '',
      fieldName: 'North Field'
    });
  };

  /**
   * Handle cancel task button press
   */
  const handleCancelTask = (taskId: string) => {
    Alert.alert(
      i18n.t('confirmCancelTask'),
      i18n.t('confirmCancelTaskMessage'),
      [
        {
          text: i18n.t('no'),
          style: 'cancel'
        },
        {
          text: i18n.t('yes'),
          style: 'destructive',
          onPress: () => {
            setTasks(tasks.map(task => 
              task.id === taskId 
                ? { ...task, status: 'cancelled' } 
                : task
            ));
          }
        }
      ]
    );
  };

  /**
   * Handle date change
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setNewTask({
        ...newTask,
        scheduledTime: selectedDate.getTime()
      });
    }
  };

  /**
   * Render task item
   */
  const renderTaskItem = ({ item }: { item: Task }) => {
    const isScheduled = item.status === 'scheduled';
    const isPast = item.scheduledTime < Date.now();
    
    return (
      <View style={styles.taskItem}>
        <View style={[styles.taskStatusIndicator, { backgroundColor: getTaskStatusColor(item.status) }]} />
        
        <View style={styles.taskIconContainer}>
          <Ionicons name={getTaskIcon(item.type) as any} size={24} color="#666" />
        </View>
        
        <View style={styles.taskContent}>
          <Text style={styles.taskName}>{item.name}</Text>
          
          <View style={styles.taskDetails}>
            <View style={styles.taskDetailItem}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.taskDetailText}>
                {formatDateTime(item.scheduledTime)}
              </Text>
            </View>
            
            <View style={styles.taskDetailItem}>
              <Ionicons name="hourglass-outline" size={14} color="#666" />
              <Text style={styles.taskDetailText}>
                {item.estimatedDuration} min
              </Text>
            </View>
            
            {item.fieldName && (
              <View style={styles.taskDetailItem}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.taskDetailText}>
                  {item.fieldName}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        
        <View style={styles.taskActions}>
          {isScheduled && !isPast && (
            <TouchableOpacity
              style={styles.taskActionButton}
              onPress={() => handleCancelTask(item.id)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Connection Status */}
        <View style={styles.connectionContainer}>
          <ConnectionStatusBadge 
            isConnected={isConnected} 
            connectionType={connectionType} 
            connectionQuality={connectionQuality} 
          />
        </View>

        {/* Tasks List */}
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          style={styles.tasksList}
          contentContainerStyle={styles.tasksListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#999" />
              <Text style={styles.emptyText}>No scheduled tasks</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create a new task</Text>
            </View>
          }
        />

        {/* Create Task Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Create Task Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{i18n.t('createTask')}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Task Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{i18n.t('taskName')}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newTask.name}
                    onChangeText={(text) => setNewTask({ ...newTask, name: text })}
                    placeholder={i18n.t('enterTaskName')}
                  />
                </View>

                {/* Task Type */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{i18n.t('taskTypeTitle')}</Text>
                  <View style={styles.taskTypeContainer}>
                    {(['cutting', 'loading', 'transport', 'custom'] as TaskType[]).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.taskTypeButton,
                          newTask.type === type && styles.taskTypeButtonActive
                        ]}
                        onPress={() => setNewTask({ ...newTask, type })}
                      >
                        <Ionicons
                          name={getTaskIcon(type) as any}
                          size={20}
                          color={newTask.type === type ? '#fff' : '#666'}
                        />
                        <Text
                          style={[
                            styles.taskTypeText,
                            newTask.type === type && styles.taskTypeTextActive
                          ]}
                        >
                          {i18n.t(`taskType.${type}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Scheduled Time */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{i18n.t('scheduledTime')}</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.datePickerText}>
                      {formatDateTime(newTask.scheduledTime || Date.now())}
                    </Text>
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(newTask.scheduledTime || Date.now())}
                      mode="datetime"
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}
                </View>

                {/* Estimated Duration */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{i18n.t('estimatedDuration')}</Text>
                  <View style={styles.durationContainer}>
                    <TextInput
                      style={styles.durationInput}
                      value={newTask.estimatedDuration?.toString()}
                      onChangeText={(text) => {
                        const duration = parseInt(text) || 0;
                        setNewTask({ ...newTask, estimatedDuration: duration });
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.durationUnit}>minutes</Text>
                  </View>
                </View>

                {/* Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{i18n.t('field')}</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newTask.fieldName}
                    onChangeText={(text) => setNewTask({ ...newTask, fieldName: text })}
                    placeholder={i18n.t('enterFieldName')}
                  />
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{i18n.t('description')}</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={newTask.description}
                    onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                    placeholder={i18n.t('enterDescription')}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>{i18n.t('cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.createTaskButton}
                  onPress={handleCreateTask}
                >
                  <Text style={styles.createTaskButtonText}>{i18n.t('createTask')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  connectionContainer: {
    marginBottom: 16,
  },
  tasksList: {
    flex: 1,
  },
  tasksListContent: {
    paddingBottom: 16,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  taskStatusIndicator: {
    width: 4,
    height: '100%',
  },
  taskIconContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    padding: 12,
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  taskDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  taskDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  taskDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
  },
  taskActions: {
    justifyContent: 'center',
    padding: 8,
  },
  taskActionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  taskTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  taskTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  taskTypeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  taskTypeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  taskTypeTextActive: {
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    color: '#333',
    width: 80,
  },
  durationUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 10,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  createTaskButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 10,
  },
  createTaskButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TasksScreen;