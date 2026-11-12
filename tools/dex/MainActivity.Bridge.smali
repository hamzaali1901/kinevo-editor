.class public final Lcom/kinevo/editor/MainActivity$Bridge;
.super Ljava/lang/Object;
.source "MainActivity.kt"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Lcom/kinevo/editor/MainActivity;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x11
    name = "Bridge"
.end annotation

.annotation system Ldalvik/annotation/SourceDebugExtension;
    value = "SMAP\nMainActivity.kt\nKotlin\n*S Kotlin\n*F\n+ 1 MainActivity.kt\ncom/kinevo/editor/MainActivity$Bridge\n+ 2 fake.kt\nkotlin/jvm/internal/FakeKt\n*L\n1#1,118:1\n1#2:119\n*E\n"
.end annotation

.annotation runtime Lkotlin/Metadata;
    d1 = {
        "\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\u0008\u0003\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\u0008\u0005\u0008\u0086\u0004\u0018\u00002\u00020\u0001B\u0007\u00a2\u0006\u0004\u0008\u0002\u0010\u0003J\u0018\u0010\u0004\u001a\u00020\u00052\u0006\u0010\u0006\u001a\u00020\u00072\u0006\u0010\u0008\u001a\u00020\u0007H\u0007J\u0010\u0010\t\u001a\u00020\u00052\u0006\u0010\n\u001a\u00020\u0007H\u0007J\u0008\u0010\u000b\u001a\u00020\u0005H\u0007\u00a8\u0006\u000c"
    }
    d2 = {
        "Lcom/kinevo/editor/MainActivity$Bridge;",
        "",
        "<init>",
        "(Lcom/kinevo/editor/MainActivity;)V",
        "begin",
        "",
        "name",
        "",
        "mime",
        "chunk",
        "b64",
        "finish",
        "app"
    }
    k = 0x1
    mv = {
        0x2,
        0x2,
        0x0
    }
    xi = 0x30
.end annotation


# instance fields
.field final synthetic this$0:Lcom/kinevo/editor/MainActivity;


# direct methods
.method public constructor <init>(Lcom/kinevo/editor/MainActivity;)V
    .registers 2
    .param p1, "this$0"    # Lcom/kinevo/editor/MainActivity;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 31
    iput-object p1, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method static final begin$lambda$2(Lcom/kinevo/editor/MainActivity;)V
    .registers 4
    .param p0, "this$0"    # Lcom/kinevo/editor/MainActivity;

    .line 50
    move-object v0, p0

    check-cast v0, Landroid/content/Context;

    .line 51
    const-string v1, "Gallery file nahi ban saki"

    check-cast v1, Ljava/lang/CharSequence;

    .line 50
    const/4 v2, 0x1

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    .line 51
    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    .line 52
    return-void
.end method

.method static final finish$lambda$3(Lcom/kinevo/editor/MainActivity;)V
    .registers 4
    .param p0, "this$0"    # Lcom/kinevo/editor/MainActivity;

    .line 73
    move-object v0, p0

    check-cast v0, Landroid/content/Context;

    .line 74
    const-string v1, "Gallery mein save ho gaya (Kinevo folder)"

    check-cast v1, Ljava/lang/CharSequence;

    .line 75
    nop

    .line 73
    const/4 v2, 0x1

    invoke-static {v0, v1, v2}, Landroid/widget/Toast;->makeText(Landroid/content/Context;Ljava/lang/CharSequence;I)Landroid/widget/Toast;

    move-result-object v0

    .line 75
    invoke-virtual {v0}, Landroid/widget/Toast;->show()V

    .line 76
    return-void
.end method


# virtual methods
.method public final begin(Ljava/lang/String;Ljava/lang/String;)V
    .registers 12
    .param p1, "name"    # Ljava/lang/String;
    .param p2, "mime"    # Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const-string v0, "name"

    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    const-string v0, "mime"

    invoke-static {p2, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    const/4 v8, 0x0

    const-string v0, "image/"

    invoke-virtual {p2, v0}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_not_image

    const/4 v8, 0x1

    :cond_not_image
    if-eqz v8, :cond_video_mime

    move-object v0, p2

    goto :mime_done

    :cond_video_mime
    move-object v0, p2

    check-cast v0, Ljava/lang/CharSequence;

    const-string v1, "mp4"

    check-cast v1, Ljava/lang/CharSequence;

    const/4 v2, 0x0

    const/4 v3, 0x2

    const/4 v4, 0x0

    invoke-static {v0, v1, v2, v3, v4}, Lkotlin/text/StringsKt;->contains$default(Ljava/lang/CharSequence;Ljava/lang/CharSequence;ZILjava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_webm

    const-string v0, "video/mp4"

    goto :mime_done

    :cond_webm
    const-string v0, "video/webm"

    :mime_done
    new-instance v1, Landroid/content/ContentValues;

    invoke-direct {v1}, Landroid/content/ContentValues;-><init>()V

    move-object v2, v1

    const/4 v3, 0x0

    const-string v5, "_display_name"

    invoke-virtual {v2, v5, p1}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const-string v5, "mime_type"

    invoke-virtual {v2, v5, v0}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    sget v5, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v6, 0x1d

    if-lt v5, v6, :cond_skip_pending

    sget-object v5, Landroid/os/Environment;->DIRECTORY_MOVIES:Ljava/lang/String;

    if-eqz v8, :cond_dir_ready

    sget-object v5, Landroid/os/Environment;->DIRECTORY_PICTURES:Ljava/lang/String;

    :cond_dir_ready
    new-instance v6, Ljava/lang/StringBuilder;

    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v6, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v5

    const-string v6, "/Kinevo"

    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v5

    invoke-virtual {v5}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v5

    const-string v6, "relative_path"

    invoke-virtual {v2, v6, v5}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    const/4 v5, 0x1

    invoke-static {v5}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v5

    const-string v6, "is_pending"

    invoke-virtual {v2, v6, v5}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/Object;)V

    :cond_skip_pending
    iget-object v2, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-virtual {v2}, Lcom/kinevo/editor/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v2

    sget-object v3, Landroid/provider/MediaStore$Video$Media;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    if-eqz v8, :cond_uri_ready

    sget-object v3, Landroid/provider/MediaStore$Images$Media;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    :cond_uri_ready
    invoke-virtual {v2, v3, v1}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object v2

    iget-object v3, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-static {v3, v2}, Lcom/kinevo/editor/MainActivity;->access$setPendingUri$p(Lcom/kinevo/editor/MainActivity;Landroid/net/Uri;)V

    const/4 v4, 0x0

    if-eqz v2, :cond_out_ready

    iget-object v4, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-virtual {v4}, Lcom/kinevo/editor/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v4

    move-object v5, v2

    invoke-virtual {v4, v5}, Landroid/content/ContentResolver;->openOutputStream(Landroid/net/Uri;)Ljava/io/OutputStream;

    move-result-object v4

    :cond_out_ready
    iget-object v3, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-static {v3, v4}, Lcom/kinevo/editor/MainActivity;->access$setOut$p(Lcom/kinevo/editor/MainActivity;Ljava/io/OutputStream;)V

    invoke-static {v3}, Lcom/kinevo/editor/MainActivity;->access$getOut$p(Lcom/kinevo/editor/MainActivity;)Ljava/io/OutputStream;

    move-result-object v3

    if-nez v3, :cond_done

    iget-object v3, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    new-instance v5, Lcom/kinevo/editor/MainActivity$Bridge$$ExternalSyntheticLambda0;

    iget-object v4, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-direct {v5, v4}, Lcom/kinevo/editor/MainActivity$Bridge$$ExternalSyntheticLambda0;-><init>(Lcom/kinevo/editor/MainActivity;)V

    invoke-virtual {v3, v5}, Lcom/kinevo/editor/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    :cond_done
    return-void
.end method

.method public final chunk(Ljava/lang/String;)V
    .registers 4
    .param p1, "b64"    # Ljava/lang/String;
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    const-string v0, "b64"

    invoke-static {p1, v0}, Lkotlin/jvm/internal/Intrinsics;->checkNotNullParameter(Ljava/lang/Object;Ljava/lang/String;)V

    .line 58
    iget-object v0, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    # getter for: Lcom/kinevo/editor/MainActivity;->out:Ljava/io/OutputStream;
    invoke-static {v0}, Lcom/kinevo/editor/MainActivity;->access$getOut$p(Lcom/kinevo/editor/MainActivity;)Ljava/io/OutputStream;

    move-result-object v0

    if-eqz v0, :cond_15

    const/4 v1, 0x0

    invoke-static {p1, v1}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object v1

    invoke-virtual {v0, v1}, Ljava/io/OutputStream;->write([B)V

    .line 59
    :cond_15
    return-void
.end method

.method public final finish()V
    .registers 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 63
    iget-object v0, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    # getter for: Lcom/kinevo/editor/MainActivity;->out:Ljava/io/OutputStream;
    invoke-static {v0}, Lcom/kinevo/editor/MainActivity;->access$getOut$p(Lcom/kinevo/editor/MainActivity;)Ljava/io/OutputStream;

    move-result-object v0

    if-eqz v0, :cond_b

    invoke-virtual {v0}, Ljava/io/OutputStream;->close()V

    .line 64
    :cond_b
    iget-object v0, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    const/4 v1, 0x0

    invoke-static {v0, v1}, Lcom/kinevo/editor/MainActivity;->access$setOut$p(Lcom/kinevo/editor/MainActivity;Ljava/io/OutputStream;)V

    .line 65
    iget-object v0, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    # getter for: Lcom/kinevo/editor/MainActivity;->pendingUri:Landroid/net/Uri;
    invoke-static {v0}, Lcom/kinevo/editor/MainActivity;->access$getPendingUri$p(Lcom/kinevo/editor/MainActivity;)Landroid/net/Uri;

    move-result-object v0

    .line 66
    .local v0, "u":Landroid/net/Uri;
    if-eqz v0, :cond_37

    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x1d

    if-lt v2, v3, :cond_37

    .line 67
    new-instance v2, Landroid/content/ContentValues;

    invoke-direct {v2}, Landroid/content/ContentValues;-><init>()V

    .line 68
    .local v2, "v":Landroid/content/ContentValues;
    const/4 v3, 0x0

    invoke-static {v3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    const-string v4, "is_pending"

    invoke-virtual {v2, v4, v3}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/Integer;)V

    .line 69
    iget-object v3, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-virtual {v3}, Lcom/kinevo/editor/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v3

    invoke-virtual {v3, v0, v2, v1, v1}, Landroid/content/ContentResolver;->update(Landroid/net/Uri;Landroid/content/ContentValues;Ljava/lang/String;[Ljava/lang/String;)I

    .line 71
    .end local v2    # "v":Landroid/content/ContentValues;
    :cond_37
    iget-object v2, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    invoke-static {v2, v1}, Lcom/kinevo/editor/MainActivity;->access$setPendingUri$p(Lcom/kinevo/editor/MainActivity;Landroid/net/Uri;)V

    .line 72
    iget-object v1, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    iget-object v2, p0, Lcom/kinevo/editor/MainActivity$Bridge;->this$0:Lcom/kinevo/editor/MainActivity;

    new-instance v3, Lcom/kinevo/editor/MainActivity$Bridge$$ExternalSyntheticLambda1;

    invoke-direct {v3, v2}, Lcom/kinevo/editor/MainActivity$Bridge$$ExternalSyntheticLambda1;-><init>(Lcom/kinevo/editor/MainActivity;)V

    invoke-virtual {v1, v3}, Lcom/kinevo/editor/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    .line 77
    return-void
.end method
