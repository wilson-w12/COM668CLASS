import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PopupNotificationService {
  private notificationSubject = new BehaviorSubject<{ message: string, type: 'success' | 'error' | 'info' | 'warning' | null }>({ message: '', type: null });
  notification$ = this.notificationSubject.asObservable();

  // Show success notification
  showSuccess(message: string) {
    this.showNotification(message, 'success');
  }

  // Show error notification
  showError(message: string) {
    this.showNotification(message, 'error');
  }

  // Show info notification
  showInfo(message: string) {
    this.showNotification(message, 'info');
  }

  // Show warning notification
  showWarning(message: string) {
    this.showNotification(message, 'warning');
  }

  // Internal method to show notification and hide after delay
  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.notificationSubject.next({ message, type });

    // Automatically hide notification after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000); // 5 seconds timeout
  }

  // Hide notification
  hideNotification() {
    this.notificationSubject.next({ message: '', type: null });
  }
}
