using System.Windows;using System.Windows.Controls;using MFCYouthAreaManagementSystem.Repositories;
namespace MFCYouthAreaManagementSystem.Views.Dialogs;
public partial class ChapterMembersWindow:Window
{
 private readonly long _chapterId;private readonly string _chapterName;private readonly MemberRepository _repo=new();public bool Changed{get;private set;}
 public ChapterMembersWindow(long id,string name){InitializeComponent();_chapterId=id;_chapterName=name;Heading.Text=name;Reload();}
 private void Reload(){var rows=_repo.GetByChapter(_chapterId,SearchBox.Text??"");Grid.ItemsSource=rows;CountText.Text=$"{rows.Count} matching member(s)";}
 private void SearchBox_TextChanged(object s,TextChangedEventArgs e)=>Reload();
 private void Add_Click(object s,RoutedEventArgs e){var d=new AddChapterMembersWindow(_chapterId,_chapterName){Owner=this};if(d.ShowDialog()==true){Changed=true;Reload();}}
 private void Close_Click(object s,RoutedEventArgs e)=>Close();
}
