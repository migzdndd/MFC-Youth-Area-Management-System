using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using MFCYouthAreaManagementSystem.Repositories;
namespace MFCYouthAreaManagementSystem.Views.Dialogs;
public partial class ServiceAssignmentWindow : Window
{
    private readonly long _memberId; private readonly ServiceRepository _repo = new();
    public ServiceAssignmentWindow(long memberId, string memberName) { InitializeComponent(); _memberId=memberId; MemberText.Text=memberName; var selected=_repo.GetServicesForMember(memberId); ServicesList.ItemsSource=_repo.GetAll().Select(s=>new ServiceChoice(s.ServiceID,s.ServiceName,selected.Contains(s.ServiceID))).ToList(); }
    private void Save_Click(object s, RoutedEventArgs e){ try { _repo.UpdateMemberServices(_memberId, ((IEnumerable<ServiceChoice>)ServicesList.ItemsSource).Where(x=>x.IsSelected).Select(x=>x.Id)); DialogResult=true; } catch(Exception ex){MessageBox.Show(this,ex.Message,"Unable to assign services",MessageBoxButton.OK,MessageBoxImage.Warning);} }
    private void Cancel_Click(object s,RoutedEventArgs e)=>DialogResult=false;
    public sealed class ServiceChoice : INotifyPropertyChanged { public long Id{get;} public string Name{get;} private bool _isSelected; public bool IsSelected{get=>_isSelected;set{_isSelected=value;PropertyChanged?.Invoke(this,new(nameof(IsSelected)));}} public ServiceChoice(long id,string name,bool selected){Id=id;Name=name;_isSelected=selected;} public event PropertyChangedEventHandler? PropertyChanged; }
}
