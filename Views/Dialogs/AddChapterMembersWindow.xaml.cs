using System.ComponentModel;using System.Windows;using System.Windows.Controls;using MFCYouthAreaManagementSystem.Repositories;
namespace MFCYouthAreaManagementSystem.Views.Dialogs;
public partial class AddChapterMembersWindow:Window
{
 private readonly long _chapterId;private readonly MemberRepository _repo=new();private readonly List<Choice> _all=new();
 public AddChapterMembersWindow(long chapterId,string chapterName){InitializeComponent();_chapterId=chapterId;ChapterText.Text=chapterName;Load();}
 private void Load(){_all.Clear();_all.AddRange(_repo.GetUnassigned().Select(m=>new Choice(m.MemberID,m.FullName,m.ContactNumber)));Apply();}
 private void Apply(){var q=SearchBox.Text.Trim();MemberList.ItemsSource=_all.Where(x=>q.Length==0||x.Name.Contains(q,StringComparison.OrdinalIgnoreCase)||x.Contact.Contains(q,StringComparison.OrdinalIgnoreCase)).ToList();}
 private void SearchBox_TextChanged(object s,TextChangedEventArgs e)=>Apply();
 private void Save_Click(object s,RoutedEventArgs e){try{var ids=_all.Where(x=>x.IsSelected).Select(x=>x.Id).ToArray();if(ids.Length==0)throw new InvalidOperationException("Select at least one unassigned Member.");_repo.AssignUnassignedMembersToChapter(_chapterId,ids);DialogResult=true;}catch(Exception ex){MessageBox.Show(this,ex.Message,"Unable to add members",MessageBoxButton.OK,MessageBoxImage.Warning);}}
 private void Cancel_Click(object s,RoutedEventArgs e)=>DialogResult=false;
 public sealed class Choice:INotifyPropertyChanged{public long Id{get;}public string Name{get;}public string Contact{get;}private bool _selected;public bool IsSelected{get=>_selected;set{_selected=value;PropertyChanged?.Invoke(this,new(nameof(IsSelected)));}}public Choice(long id,string name,string contact){Id=id;Name=name;Contact=contact;}public event PropertyChangedEventHandler? PropertyChanged;}
}
