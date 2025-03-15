import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupNotificationService } from '../services/popup-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-popup-notification',
  imports: [CommonModule], 
  templateUrl: './popup-notification.component.html',
  styleUrls: ['./popup-notification.component.css'],
})
export class PopupNotificationComponent implements OnInit, OnDestroy {
  message: string = '';
  type: 'success' | 'error' | 'info' | 'warning' | null = null;
  private notificationSubscription: Subscription | null = null;

  constructor(private popupService: PopupNotificationService) {}

  ngOnInit(): void {
    this.notificationSubscription = this.popupService.notification$.subscribe((notification) => {
      this.message = notification.message;
      this.type = notification.type;
    });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // Hide the notification
  closeNotification() {
    this.popupService.hideNotification();
  }
}
