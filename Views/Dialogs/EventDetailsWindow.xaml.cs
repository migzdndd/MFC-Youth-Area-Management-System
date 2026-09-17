using System.Windows;using System.Windows.Controls;using MFCYouthAreaManagementSystem.Models;using MFCYouthAreaManagementSystem.Repositories;
namespace MFCYouthAreaManagementSystem.Views.Dialogs;
public partial class EventDetailsWindow:Window
{
 private readonly long _eventId;private readonly EventRepository _events=new();private readonly EventParticipantRepository _participants=new();public bool Changed{get;private set;}
 public EventDetailsWindow(long eventId){InitializeComponent();_eventId=eventId;SearchBox.TextChanged+=SearchBox_TextChanged;Reload();}
 private EventParticipant? Selected=>Grid.SelectedItem as EventParticipant;
 private void Reload(){var e=_events.GetById(_eventId)??throw new InvalidOperationException("Event not found.");Heading.Text=e.EventName;MetaText.Text=$"{e.EventDateTime:MMM d, yyyy • h:mm tt} • {e.Venue}";DescriptionText.Text=e.EventDescription;RegisteredText.Text=e.RegisteredCount.ToString();AttendedText.Text=_participants.GetAttendedCountByEvent(_eventId).ToString();PaidText.Text=e.PaidCount.ToString();CollectedText.Text=$"₱{e.TotalRegistrationFees:N2}";Grid.ItemsSource=_participants.GetByEvent(_eventId,SearchBox.Text??"");}
 private void SearchBox_TextChanged(object s,TextChangedEventArgs e)=>Reload();
 private void Add_Click(object s,RoutedEventArgs e){if(new ParticipantEditorWindow(_eventId){Owner=this}.ShowDialog()==true){Changed=true;Reload();}}
 private void Edit_Click(object s,RoutedEventArgs e){if(Selected==null){Warn();return;}if(new ParticipantEditorWindow(_eventId,Selected.ParticipantID){Owner=this}.ShowDialog()==true){Changed=true;Reload();}}
 private void Delete_Click(object s,RoutedEventArgs e){if(Selected==null){Warn();return;}if(MessageBox.Show(this,$"Delete registration for {Selected.FullName}?","Confirm delete",MessageBoxButton.YesNo,MessageBoxImage.Warning)!=MessageBoxResult.Yes)return;try{_participants.Delete(Selected.ParticipantID,_eventId);Changed=true;Reload();}catch(Exception ex){MessageBox.Show(this,ex.Message,"Unable to delete participant",MessageBoxButton.OK,MessageBoxImage.Warning);}}
 private void Warn()=>MessageBox.Show(this,"Select a participant first.","Event Participants",MessageBoxButton.OK,MessageBoxImage.Information);private void Close_Click(object s,RoutedEventArgs e)=>Close();
}
